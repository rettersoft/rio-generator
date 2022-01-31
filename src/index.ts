import { Classes, Models, quickTypeJSONSchema, SupportedProgrammingLanguage } from './utils'
import { renderTypescript } from './languages/server/typescript'
import { renderKotlin } from './languages/client/kotlin'
import { renderSwift } from './languages/client/swift'
import { renderTypescript as renderTypescriptClient } from './languages/client/typescript'

export async function generator(params: { classes: Classes; models: Models }, language: SupportedProgrammingLanguage = 'typescript'): Promise<string> {
    const { classes, models } = params
    const { lines } = await quickTypeJSONSchema('RioModels', JSON.stringify({ properties: { ...models }, $defs: { ...models } }), language)
    const interfaces = lines.join('\n')
    switch (language) {
        case 'kotlin-client':
            return renderKotlin(classes, interfaces)
        case 'swift-client':
            return renderSwift(classes, interfaces)
        case 'typescript-client':
            return renderTypescriptClient(classes, interfaces)
        case 'typescript':
        default:
            return renderTypescript(classes, interfaces)
    }
}
