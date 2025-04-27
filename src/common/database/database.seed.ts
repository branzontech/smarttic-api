import { DataSource } from 'typeorm';
import { IdentificationType } from '../../modules/identification-type/entities/identification-type.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import dataSource from 'typeorm.config';

export async function seedDatabase(dataSource: DataSource) {
  const identificationTypeRepository = dataSource.getRepository(IdentificationType);
  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);

  // 1. Crear Tipos de Identificación
  const identificationTypes = [
    { code: 'CC', description: 'Cédula de Ciudadanía' },
    { code: 'TI', description: 'Tarjeta de Identidad' },
    { code: 'CE', description: 'Cédula de Extranjería' },
  ];

  await identificationTypeRepository.save(identificationTypes);
  console.log('Tipos de identificación creados.');

  // 2. Crear Roles
  const roles = [
    { name: 'SUPERADMINISTRADOR', isAdmin: true, isAgent: false, isConfigurator: true, state: true },
    { name: 'ADMINISTRADOR', isAdmin: true, isAgent: false, isConfigurator: false, state: true },
    { name: 'AGENTE', isAdmin: false, isAgent: true, isConfigurator: false, state: true },
  ];

  await roleRepository.save(roles);
  console.log('Roles creados.');

  // 3. Crear Usuario SUPERADMINISTRADOR
  const superAdminRole = await roleRepository.findOne({ where: { name: 'SUPERADMINISTRADOR' } });
  const cedulaType = await identificationTypeRepository.findOne({ where: { code: 'CC' } });

  if (superAdminRole && cedulaType) {
    const hashedPassword = await bcrypt.hash('superadmin123', 10); // Cambia la contraseña según sea necesario 

    const superAdminUser = userRepository.create({
      name: 'Super',
      lastname: 'Admin',
      email: 'superadmin@example.com',
      address: 'Calle 123',
      phone: 1234567890,
      identificationTypeId: cedulaType.id,
      numberIdentification: "123456789",
      username: 'superadmin',
      password: hashedPassword,
      roleId: superAdminRole.id,
      state: true,
    });

    await userRepository.save(superAdminUser);
    console.log('Usuario SUPERADMINISTRADOR creado.');
  } else {
    console.error('No se encontró el rol SUPERADMINISTRADOR o el tipo de identificación CC.');
  }
}

async function runSeeder() {
    
  
    try {
      await dataSource.initialize();
      console.log('Conexión a la base de datos establecida.');
  
      await seedDatabase(dataSource);
      console.log('Seeder ejecutado correctamente.');
    } catch (error) {
      console.error('Error durante la ejecución del seeder:', error);
    } finally {
      await dataSource.destroy();
      console.log('Conexión a la base de datos cerrada.');
    }
  }
  
  runSeeder();