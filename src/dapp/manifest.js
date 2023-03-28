import { user } from 'dapp';


// 'contract' should be hard coded by application developer
let contract = "HAqoeWjzY4UiAU3miFDdqo8iL88ekM6f26tvqEkB3ART",
    definitions = {
        manifest: {
            additionalProperties: false,
            indices: [
                { properties: [{ $ownerId: 'asc' }], unique: false }
            ],
            properties: {
                description: {
                    type: 'string'
                },
                ipfs: {
                    type: 'string'
                },
                keywords: {
                    items: {
                        type: 'string'
                    },
                    type: 'array'
                },
                name: {
                    type: 'string'
                },
                repository: {
                    type: 'string'
                },
                version: {
                    type: 'string'
                }
            },
            required: ['description', 'ipfs', 'name', 'repository', 'version'],
            type: 'object'
        }
    },
    locators = {
        manifest: 'dapp.manifest'
    };


const methods = {
    delete: async (documents) => {
        return await user.document.delete(documents);
    },
    read: async (query) => {
        return await user.document.read(locators.manifest, query || {});
    },
    register: async () => {
        await user.apps.get('dapp', async () => {
            return contract || ( await user.contract.register(definitions) )['$id'];
        });

        return contract == true;
    },
    save: async (documents) => {
        return await user.document.save(documents, locators.manifest);
    },
};


export default methods;
