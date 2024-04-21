import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
export class CustomValidationPipe extends ValidationPipe {
  createExceptionFactory() {
    return (validationErrors = []) => {
      // 显示第一条错误
      const messages: any = Object.values(validationErrors[0].constraints);
      const message = messages[messages.length - 1];
      // console.log(Object.values(validationErrors[0].constraints));
      console.log(validationErrors);
      throw new WsException(message);
    };
  }
}
