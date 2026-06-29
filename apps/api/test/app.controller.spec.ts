import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "../src/app.controller";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  describe("getHealth", () => {
    it('should return { status: "ok" }', () => {
      expect(controller.getHealth()).toEqual({ status: "ok" });
    });
  });
});
