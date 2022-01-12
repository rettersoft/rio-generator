import { generator } from '..'

const template = `
preAuthorizer: index.preAuthorizer
init: index.init
getState: index.getState
methods:
  - method: hello
    tag: test
    sync: true
    inputModel: HelloInput
    steps:
      - id: default
        handler: index.hello
`

test('invalid template throws error', async () => {
    try {
        await generator({ classes: { a: Math.random().toString() }, models: {} })
    } catch (e) {
        expect((e as Error).message).toEqual('template.methods is not iterable')
    }
})

test('render ok', async () => {
    const file = await generator({
        classes: { User: template },
        models: {
            HelloInput: {
                type: 'object',
                properties: {
                    firstName: {
                        type: 'string',
                        description: "The person's first name.",
                    },
                    lastName: {
                        type: 'string',
                        description: "The person's last name.",
                    },
                    age: {
                        description: 'Age in years which must be equal to or greater than zero.',
                        type: 'integer',
                        minimum: 0,
                    },
                },
            },
        },
    })
    console.log(file)
})
