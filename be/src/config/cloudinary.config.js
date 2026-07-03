import config from './env.config.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: config.CLOUDINARY.cloud_name,
  api_key: config.CLOUDINARY.api_key,
  api_secret: config.CLOUDINARY.api_secret,
});

export default { cloudinary };