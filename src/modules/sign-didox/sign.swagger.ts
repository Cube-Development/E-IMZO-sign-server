import { SignDocumentSchema } from "./dto";
import { ROUTES_SIGN } from "./sign.routes";

export const CreateSignDidoxDocumentSwagger = {
  method: 'post',
  path: `${ROUTES_SIGN.BASE}${ROUTES_SIGN.CREATE_DIDOX}`, 
  summary: 'Подписать документ',
  description: 'Создает цифровую подпись для документа',
  tags: ['Подпись документов'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: SignDocumentSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Документ успешно подписан',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: { type: 'string', example: 'Документ подписан!' },
              data: {
                type: 'object',
                properties: {
                  doc_id: { type: 'string', example: '11F07C2E295C694CBEEA3AEFC31432BF' },
                  owner: { type: 'integer', example: 1 }
                }
              }
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
                  doc_id: ['doc_id is required'],
                  owner: ['owner must be 0 or 1']
                }
              }
            }
          }
        }
      }
}
}
}