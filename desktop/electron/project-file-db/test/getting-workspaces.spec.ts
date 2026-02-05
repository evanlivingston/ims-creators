import { ProjectFileDb } from "../ProjectFileDb"


async function loadDb(){
    const db = new ProjectFileDb(__dirname + "/project-data");
    await db.init({
        id: 'EWvDFxqn',
        title: 'Test project'
    })
    return db;
}

test('directory list', async () => {
    const db = await loadDb();

    const characters_workspace_id = "0312ebc4-bf36-452a-ac0d-a67023c7ed9f";

    const res = await db.workspace.workspacesGet({
        where: {
            parentId: characters_workspace_id,
            isSystem: false
        },
        count: 2
    })
    expect(res).toEqual({
        "list": [
            {
                "id": "887cda5d-47ff-475d-9bf5-88d42f24fd7a",
                "title": "Enemies",
                "name": null,
                "projectId": "EWvDFxqn",
                "parentId": "0312ebc4-bf36-452a-ac0d-a67023c7ed9f",
                //"createdAt": "2025-08-08T14:43:27.708Z",
                //"updatedAt": "2025-09-04T20:26:43.308Z",
                "rights": 5,
                "unread": 0,
                "index": 3,
                "props": {
                    "type": "collection",
                    "asset": {
                        "Title": "Character",
                        "AssetId": "dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984"
                    },
                    "views\\table\\key": "table",
                    "views\\table\\sort": [],
                    "views\\table\\type": "table",
                    "views\\table\\index": 1,
                    "views\\table\\props": [
                        0,
                        1,
                        2,
                        3,
                        4
                    ],
                    "views\\table\\title": "Table",
                    "views\\table\\filter": [],
                    "views\\table\\props\\0\\prop": "title",
                    "views\\table\\props\\1\\prop": "description|value",
                    "views\\table\\props\\2\\prop": "props|health",
                    "views\\table\\props\\3\\prop": "props|damage",
                    "views\\table\\props\\4\\prop": "props|abilities",
                    "views\\table\\props\\0\\width": 200,
                    "views\\table\\props\\1\\width": null,
                    "views\\table\\props\\2\\width": null,
                    "views\\table\\props\\3\\width": null,
                    "views\\table\\props\\4\\width": null
                }
            },
            {
                "id": "604bd733-4080-4ed9-b8cf-54e4c7678c48",
                "title": "Allies",
                "name": null,
                "projectId": "EWvDFxqn",
                "parentId": "0312ebc4-bf36-452a-ac0d-a67023c7ed9f",
                //"createdAt": "2025-08-15T12:19:32.808Z",
                //"updatedAt": "2025-09-04T20:26:48.685Z",
                "rights": 5,
                "unread": 0,
                "index": null,
                "props": {
                    "type": "collection",
                    "asset": {
                        "Title": "Character",
                        "AssetId": "dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984"
                    },
                    "views\\table\\key": "table",
                    "views\\table\\sort": [],
                    "views\\table\\type": "table",
                    "views\\table\\index": 1,
                    "views\\table\\props": [
                        0,
                        1,
                        2,
                        3,
                        4
                    ],
                    "views\\table\\title": "Table",
                    "views\\table\\filter": [],
                    "views\\table\\props\\0\\prop": "title",
                    "views\\table\\props\\1\\prop": "description|value",
                    "views\\table\\props\\2\\prop": "props|health",
                    "views\\table\\props\\3\\prop": "props|damage",
                    "views\\table\\props\\4\\prop": "props|abilities",
                    "views\\table\\props\\0\\width": 200,
                    "views\\table\\props\\1\\width": null,
                    "views\\table\\props\\2\\width": null,
                    "views\\table\\props\\3\\width": null,
                    "views\\table\\props\\4\\width": null
                }
            }
        ],
        "total": 2
    })
})

test('get workspaces with hasAssets', async() => {
    const db = await loadDb();
    const res = await db.workspace.workspacesGet({
        where: {
            "hasAssets":{"typeids":"dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984"},
            "parentId": db.RootGddFolder.id
        }
    })

    expect(res).toEqual({
        "list": [
            {
                "id": "0312ebc4-bf36-452a-ac0d-a67023c7ed9f",
                "title": "Characters",
                "name": null,
                "projectId": "EWvDFxqn",
                "parentId":db.RootGddFolder.id,
                //"createdAt": "2025-08-15T12:19:07.727Z",
                //"updatedAt": "2025-08-20T09:20:44.087Z",
                "rights": 5,
                "unread": 0,
                "index": 0.035479072,
                "props": {}
            }
        ],
        "total": 1
    })

})

