import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { VideoGateway } from './video/video.gateway';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // path to your static files
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway, VideoGateway],
})
export class AppModule { }
