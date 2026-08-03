import {mkdir, copyFile, writeFile} from 'node:fs/promises'
await mkdir('dist/server',{recursive:true})
await mkdir('dist/.openai',{recursive:true})
await copyFile('.openai/hosting.json','dist/.openai/hosting.json')
await writeFile('dist/server/index.js',`export default {\n  async fetch(request, env) {\n    const url = new URL(request.url);\n    let response = await env.ASSETS.fetch(request);\n    if (response.status === 404 && !url.pathname.includes('.')) {\n      response = await env.ASSETS.fetch(new Request(new URL('/', url), request));\n    }\n    return response;\n  }\n};\n`)
