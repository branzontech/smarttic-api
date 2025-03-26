import { JwtService } from '@nestjs/jwt';
import { AuthzGuard } from './authz.guard';
import { PrismaService } from 'src/common/database/prisma.service';

describe('AuthzGuard', () => {
  let jwtService: JwtService;
  let prismaService: PrismaService;

  it('should be defined', () => {
    expect(new AuthzGuard(jwtService, prismaService)).toBeDefined();
  });
});
