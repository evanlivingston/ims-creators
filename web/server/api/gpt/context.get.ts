import { defineEventHandler } from 'h3';
import { buildGptContext } from '../../utils/gpt-helpers';

export default defineEventHandler(async () => {
  return await buildGptContext();
});
