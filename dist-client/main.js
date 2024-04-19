"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express = require("express");
const path = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(express.static(path.join(__dirname, '..', 'dist-client', 'public')));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map