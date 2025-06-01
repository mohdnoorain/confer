
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class VideoGateway {
  @WebSocketServer()
  server: Server;

  // When a user joins the room
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);

    // Get all clients in the room except the new user
    const clientsInRoom = this.server.sockets.adapter.rooms.get(data.roomId) || new Set();
    const otherUsers = [...clientsInRoom].filter((id) => id !== client.id);

    // Tell the new user who else is in the room
    client.emit('all-users', otherUsers);

    // Notify others that a new user has joined
    client.to(data.roomId).emit('user-connected', client.id);
  }

  // Relay offer to the target user
  @SubscribeMessage('offer')
  handleOffer(@MessageBody() data: any) {
    this.server.to(data.target).emit('offer', data);
  }

  // Relay answer to the target user
  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() data: any) {
    this.server.to(data.target).emit('answer', data);
  }

  // Relay ICE candidates to the target user
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(@MessageBody() data: any) {
    this.server.to(data.target).emit('ice-candidate', data);
  }
}
