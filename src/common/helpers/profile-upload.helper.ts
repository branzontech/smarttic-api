import { existsSync, mkdirSync, constants, access } from 'fs';
import { resolve } from 'path';
import { diskStorage } from 'multer';

const userUploadDir = resolve(__dirname, '../../../uploads/users/profiles');

export const profileStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(userUploadDir)) {
      mkdirSync(userUploadDir, { recursive: true });
    }

    access(userUploadDir, constants.W_OK, (err) => {
      if (err) {
        return cb(new Error('No write permissions'), '');
      }
      cb(null, userUploadDir);
    });
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const profileOptions = {
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`
        ),
        false
      );
    }
  },
};
