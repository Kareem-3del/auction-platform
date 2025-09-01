import type { NextRequest } from 'next/server';

import jwt from 'jsonwebtoken';
import { handleAPIError } from 'src/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameter since EventSource doesn't support custom headers
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return handleAPIError({
        name: 'AuthError',
        message: 'Authentication token required'
      });
    }

    // Verify JWT token
    const getSecret = () => {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET required');
      return secret;
    };

    let userId: string;
    try {
      const decoded = jwt.verify(token, getSecret()) as any;
      userId = decoded.user?.id;
      if (!userId) throw new Error('Invalid token structure');
    } catch (error) {
      return handleAPIError({
        name: 'AuthError',
        message: 'Invalid or expired token'
      });
    }
    
    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to notification stream',
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(encoder.encode(initialMessage));

        // Keep connection alive with periodic heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`;
            
            controller.enqueue(encoder.encode(heartbeat));
          } catch (error) {
            clearInterval(heartbeatInterval);
            controller.close();
          }
        }, 30000); // Send heartbeat every 30 seconds

        // Store connection info for cleanup (in a real app, you'd store this in Redis or memory)
        const connectionId = `${userId}_${Date.now()}`;
        
        // In production, you would:
        // 1. Store this connection in a connection manager (Redis, memory store)
        // 2. Listen for database changes or message queue events
        // 3. Send notifications to specific user connections
        
        // Simulate sending notifications (in production, this would be triggered by actual events)
        const notificationInterval = setInterval(() => {
          // This is just for demo - in real app, notifications would be triggered by actual events
          if (Math.random() > 0.95) { // 5% chance every interval
            try {
              const demoNotification = {
                type: 'notification',
                data: {
                  id: `notif_${Date.now()}`,
                  userId,
                  title: 'New Update Available',
                  message: 'Your account has been updated with new features.',
                  notificationType: 'SYSTEM',
                  isRead: false,
                  createdAt: new Date().toISOString(),
                  metadata: {
                    source: 'system',
                    priority: 'normal'
                  }
                }
              };

              const message = `data: ${JSON.stringify(demoNotification)}\n\n`;
              controller.enqueue(encoder.encode(message));
            } catch (error) {
              console.error('Error sending demo notification:', error);
            }
          }
        }, 10000); // Check every 10 seconds

        // Cleanup function
        const cleanup = () => {
          clearInterval(heartbeatInterval);
          clearInterval(notificationInterval);
          try {
            controller.close();
          } catch (error) {
            console.error('Error closing controller:', error);
          }
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup);
        
        // Store cleanup function for potential server-side cleanup
        // In production, you'd store this in a connection manager
      },
      
      cancel() {
        // Client disconnected
        console.log(`SSE connection closed for user ${userId}`);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      },
    });
    
  } catch (error) {
    console.error('SSE stream error:', error);
    return handleAPIError(error);
  }
}