import { Test, TestingModule } from '@nestjs/testing';
import { ShortcutsController } from './shortcuts.controller';
import { ShortcutsService } from './shortcuts.service';

describe('ShortcutsController', () => {
  let controller: ShortcutsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortcutsController],
      providers: [ShortcutsService],
    }).compile();

    controller = module.get<ShortcutsController>(ShortcutsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
