import { AuthzGuard } from './authz.guard';
import { JwtService } from '@nestjs/jwt';
import { CacheManagerService } from 'src/common/cache-manager/cache-manager.service';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

describe('AuthzGuard', () => {
  let jwtService: JwtService;
  let cacheManagerService: CacheManagerService;
  let userRepository: Repository<User>;

  beforeEach(() => {
    // Cast básicos para evitar errores de tipo
    jwtService = {} as JwtService;
    cacheManagerService = {} as CacheManagerService;
    userRepository = {} as Repository<User>;
  });

  it('should be defined', () => {
    const guard = new AuthzGuard(userRepository, jwtService, cacheManagerService);
    expect(guard).toBeDefined();
  });
});

