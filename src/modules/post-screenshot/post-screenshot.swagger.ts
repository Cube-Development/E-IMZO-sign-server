import { PostScreenShotSchema } from "./dto";
import { ROUTES_SCREENSHOT } from "./post-screenshot.routes";

export const CreatePostScreenShotSwagger = {
  method: 'post',
  path: `${ROUTES_SCREENSHOT.BASE}${ROUTES_SCREENSHOT.POST_SCREENSHOT}`, 
  summary: 'Создать скриншот',
  description: 'Создает скриншот по URL',
  tags: ['Подпись документов'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: PostScreenShotSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Скриншот успешно создан',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'boolean', example: 'true' },
               file_name: { type: 'string', example: 'File.png' },
            
            }
          }
        }
        }
    },
    422: {
      description: 'Ошибка валидации',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'error' },
              message: { type: 'string', example: 'Ошибка валидации' },
              errors: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: { type: 'string' }
                },
                example: {
                  post_url: ['post_url is required'],
                }
              }
            }
          }
        }
      }
}
}
}