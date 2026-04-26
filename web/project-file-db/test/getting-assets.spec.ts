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

    const effects_workspace_id = 'ccdb4470-6602-472a-9d32-ae352f71fac2';

    const res = await db.asset.assetsGetShort({
        where: {
            workspaceId: effects_workspace_id
        },
        count: 2
    })
    expect(res).toEqual({
        "list": [
            {
                "id": "0ab6b267-54d8-4009-8f85-b9e0d605bfff",
                "projectId": "EWvDFxqn",
                "typeIds": [
                    "4ce7b352-31ee-4e48-ab25-ef619d223862",
                    "00000000-0000-0000-0000-000000000035"
                ],
                "title": "Frozen",
                "name": null,
                "icon": "sparkling-2-fill",
                "isAbstract": false,
                "creatorUserId": undefined,//"28",
                "createdAt": undefined,//"2025-08-20T13:09:54.459Z",
                "updatedAt": undefined,//"2025-08-20T13:12:36.163Z",
                "deletedAt": undefined, //null,
                "rights": 5,
                "unread": 0,
                "workspaceId": "ccdb4470-6602-472a-9d32-ae352f71fac2",
                "index": null,
                "hasImage": true
            },
            {
                "id": "9809f24a-a9d7-4249-890d-525f18ebf6c8",
                "projectId": "EWvDFxqn",
                "typeIds": [
                    "4ce7b352-31ee-4e48-ab25-ef619d223862",
                    "00000000-0000-0000-0000-000000000035"
                ],
                "title": "Heal",
                "name": null,
                "icon": "sparkling-2-fill",
                "isAbstract": false,
                "creatorUserId": undefined,//"28",
                "createdAt": undefined,//"2025-08-20T13:29:48.477Z",
                "updatedAt": undefined,//"2025-08-20T13:31:57.133Z",
                "deletedAt": undefined, //null,
                "rights": 5,
                "unread": 0,
                "workspaceId": "ccdb4470-6602-472a-9d32-ae352f71fac2",
                "index": null,
                "hasImage":  true
            }
        ],
        "objects": {
            "workspaces": {
                "ccdb4470-6602-472a-9d32-ae352f71fac2": {
                    "id": "ccdb4470-6602-472a-9d32-ae352f71fac2",
                    "title": "Effects",
                    "name": null,
                    "projectId": "EWvDFxqn",
                    "parentId": db.RootGddFolder.id,
                    //"createdAt": "2025-08-20T13:08:43.369Z",
                    //"updatedAt": "2025-09-04T20:25:59.984Z",
                    "rights": 5,
                    "unread": 0,
                    "index": 8.17557,
                    "props": {
                        "type": "collection",
                        "asset": {
                            "Title": "Effect",
                            "AssetId": "4ce7b352-31ee-4e48-ab25-ef619d223862"
                        },
                        "views\\table\\key": "table",
                        "views\\table\\sort": [],
                        "views\\table\\type": "table",
                        "views\\table\\index": 1,
                        "views\\table\\props": [
                            0,
                            1
                        ],
                        "views\\table\\title": "Table",
                        "views\\table\\filter": [],
                        "views\\table\\props\\0\\prop": "title",
                        "views\\table\\props\\1\\prop": "description|value",
                        "views\\table\\props\\0\\width": 200,
                        "views\\table\\props\\1\\width": null
                    }
                },
                [db.RootGddFolder.id]: db.RootGddFolder
            },
            "users": {}
        },
        "total": 8
    })
})

test('getting preview view', async () => {
    const db = await loadDb();

    const res = await db.asset.assetsGetView({
        "select": [
            "id",
            "title",
            "name",
            "icon",
            "isAbstract",
            "rights",
            {
                "prop": "gallery|main",
                "as": "mainImage"
            },
            {
                "prop": "description|value",
                "as": "description"
            },
            {
                "prop": "__meta|complete_track",
                "as": "completeTrack"
            },
            {
                "prop": "__meta|complete_set",
                "as": "completeSet"
            },
            {
                "prop": "__meta|complete_progress",
                "as": "completeProgress"
            },
            {
                "prop": "__meta|plan_milestone",
                "as": "planMilestone"
            }
        ],
        "where": {
            "id": [
                "7cf24619-9339-48f2-a688-ed6c050f502c"
            ]
        }}, {
        "folded": true
    })

    expect(res).toEqual({
        "list": [
            {
            "id": "7cf24619-9339-48f2-a688-ed6c050f502c",
            "title": "Expensive life",
            "name": null,
            "icon": "file-paper-2-fill",
            "isAbstract": false,
            "rights": 5,
            "mainImage": null,
            "description": null,
            "completeTrack": true,
            "completeSet": null,
            "completeProgress": null,
            "planMilestone": null
            }
        ],
        "total": 1
    })

})

test('getting preview view 2', async () => {
    const db = await loadDb();

    const res = await db.asset.assetsGetView({
        "select": [
            "id",
            "title",
            "name",
            "icon",
            "isAbstract",
            "rights",
            {
                "prop": "gallery|main",
                "as": "mainImage"
            },
            {
                "prop": "description|value",
                "as": "description"
            },
            {
                "prop": "__meta|complete_track",
                "as": "completeTrack"
            },
            {
                "prop": "__meta|complete_set",
                "as": "completeSet"
            },
            {
                "prop": "__meta|complete_progress",
                "as": "completeProgress"
            },
            {
                "prop": "__meta|plan_milestone",
                "as": "planMilestone"
            }
        ],
        "where": {
            "id": [
                "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
            ]
        }}, {
        "folded": true
    })

    expect(res).toEqual({
        "list": [
            {
                "id": "bbb048b7-2460-43a8-b6b3-fe50544b9a64",
                "title": "Hunter",
                "name": null,
                "icon": "walk-fill",
                "isAbstract": false,
                "rights": 5,
                "description": "Hunter of the Order of Conquerors. In combat, they strive to maintain distance.",
                "completeTrack": true,
                "completeSet": null,
                "completeProgress": null,
                "planMilestone": {
                    "Enum": "00000000-0000-0000-0000-000000000015",
                    "Name": "beta",
                    "Title": "[[t:MilestoneBeta]]"
                },
                "mainImage": {
                    "type": "file",
                    "index": 1.1755712095354,
                    "value": {
                        "Dir": null,
                        "Size": 2442472,
                        "Store": "p-EWvDFxqn",
                        "Title": "image-fb4f687a-c488-4c68-84b9-5723c06070da.png",
                        "FileId": "87ddf5f2-04b5-458b-9100-b1e7980849c8"
                    }
                }
            }
        ],
        "total": 1
        })

})

test('getting full', async () => {
    const db = await loadDb();

    const res = await db.asset.assetsGetFull({
       where: {
        id: ["7cf24619-9339-48f2-a688-ed6c050f502c"]
       } 
    })

    expect(res).toEqual({
        "ids": [
            "7cf24619-9339-48f2-a688-ed6c050f502c"
        ],
        "objects": {
            "assetFulls": {
                "7cf24619-9339-48f2-a688-ed6c050f502c": {
                    "id": "7cf24619-9339-48f2-a688-ed6c050f502c",
                    "projectId": "EWvDFxqn",
                    "createdAt": undefined,//"2025-08-08T14:43:27.906Z",
                    "creatorUserId": null, //"2251",
                    "deletedAt": null,
                    "icon": "file-paper-2-fill",
                    "isAbstract": false,
                    "name": null,
                    "typeIds": [
                        "00000000-0000-0000-0000-000000000033"
                    ],
                    "parentIds": [
                        "00000000-0000-0000-0000-000000000033"
                    ],
                    "title": "Expensive life",
                    "updatedAt": undefined,//"2025-12-03T06:37:50.944Z",
                    "workspaceId": "106688fe-f06c-4a8d-b791-f85e5deb3090",
                    "rights": 5,
                    "unread": 0,
                    "ownIcon": null,
                    "ownTitle": "Expensive life",
                    "index": 3,
                    "lastViewedAt": undefined,//"2025-12-03T06:49:22.742Z",
                    "hasImage": false,
                    "blocks": [
                        {
                            "id": "00000000-0000-0000-0000-000000000100",
                            "name": "__meta",
                            "title": null,
                            "own": true,
                            "type": "props",
                            "props": {},
                            "computed": {
                                "complete_set": null,
                                "complete_comp": 0,
                                "complete_track": true,
                                "plan_milestone": null,
                                "complete_progress": null
                            },
                            "inherited": {
                                "complete_set": null,
                                "complete_comp": 0,
                                "complete_track": true,
                                "plan_milestone": null,
                                "complete_progress": null
                            },
                            "index": 0,
                            "createdAt": "2025-08-08T14:43:27.906Z",
                            "updatedAt": "2025-08-08T14:43:27.906Z",
                            "rights": null
                        },
                        {
                            "id": "00000000-0000-0000-0000-330000000001",
                            "name": "content",
                            "title": "[[t:Content]]",
                            "own": true,
                            "type": "script",
                            "props": {
                                "start": "a766bb24-bef9-46ea-965a-0bb88fe5985a",
                                "variables\\own\\rage\\name": "rage",
                                "variables\\own\\rage\\type": {
                                    "Type": "integer"
                                },
                                "variables\\own\\rage\\title": "Rage",
                                "variables\\own\\rage\\autoFill": null,
                                "variables\\own\\inspected\\name": "inspected",
                                "variables\\own\\inspected\\type": {
                                    "Type": "boolean"
                                },
                                "variables\\own\\inspected\\title": "Inspected",
                                "variables\\own\\rage\\description": "In order to engage in battle, you need a sufficient amount of rage",
                                "__settings\\speech\\main\\text\\name": "text",
                                "__settings\\speech\\main\\text\\type": {
                                    "Type": "text"
                                },
                                "variables\\own\\inspected\\autoFill": null,
                                "__settings\\speech\\main\\text\\index": 2,
                                "__settings\\speech\\main\\text\\title": "[[t:Text]]",
                                "__settings\\speech\\option\\text\\name": "text",
                                "__settings\\speech\\option\\text\\type": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\text\\default": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\option\\text\\title": "[[t:Text]]",
                                "variables\\own\\inspected\\description": null,
                                "__settings\\speech\\main\\character\\name": "character",
                                "__settings\\speech\\main\\character\\type": {
                                    "Kind": "dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984",
                                    "Type": "asset"
                                },
                                "__settings\\speech\\option\\text\\default": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\character\\index": 1,
                                "__settings\\speech\\main\\character\\title": "[[t:Character]]",
                                "__settings\\speech\\main\\description\\name": "description",
                                "__settings\\speech\\main\\description\\type": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\text\\description": null,
                                "__settings\\speech\\main\\character\\default": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\description\\index": 0,
                                "__settings\\speech\\main\\description\\title": "Description",
                                "__settings\\speech\\main\\character\\autoFill": true,
                                "__settings\\speech\\option\\text\\description": null,
                                "__settings\\speech\\main\\description\\autoFill": null,
                                "__settings\\speech\\main\\character\\description": null,
                                "__settings\\speech\\main\\description\\description": "What happens behind the scenes?",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\next": "8530b11d-266e-42f1-8d31-f52b1e1eb8e2",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\type": "setVar",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\next": "816917ea-7b9d-4b5e-b73c-555ffe2f8902",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\type": "speech",
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\next": null,
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\type": "getVar",
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\next": null,
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\type": "end",
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\next": null,
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\type": "opNot",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\next": null,
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\type": "opLess",
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\next": null,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\type": "opPlus",
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\next": null,
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\type": "getVar",
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\next": "b1752ca8-318b-41e1-92d2-e9c5cf5a046a",
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\type": "setVar",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\next": "c66949ec-77a9-4749-a056-640637b65692",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\type": "trigger",
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\next": "6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8",
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\type": "speech",
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\next": "c0a0aafb-c8f0-4fe9-b8d5-872730837a46",
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\type": "trigger",
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\next": "43f1325a-d949-4489-9c6a-c3112ae33ee8",
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\type": "trigger",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\next": null,
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\type": "speech",
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\next": "816917ea-7b9d-4b5e-b73c-555ffe2f8902",
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\type": "speech",
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\next": "9c644390-8980-435e-9109-9e95423c5347",
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\type": "setVar",
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\next": null,
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\type": "end",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\next": null,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\type": "speech",
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\next": "c0a0aafb-c8f0-4fe9-b8d5-872730837a46",
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\type": "start",
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\next": "c0a0aafb-c8f0-4fe9-b8d5-872730837a46",
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\type": "speech",
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\next": null,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\type": "branch",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\next": null,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\type": "speech",
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\next": null,
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\type": "getVar",
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\next": null,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\type": "opMore",
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\next": null,
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\type": "end",
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\next": null,
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\type": "getVar",
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\next": "89dfaf94-57fb-44d9-81f8-1cdf85f224c5",
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\type": "speech",
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\next": null,
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\type": "end",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\pos\\x": 590,
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\pos\\y": 1400,
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\pos\\x": 2370,
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\pos\\y": -390,
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\pos\\x": 1230,
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\pos\\y": 2190,
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\pos\\x": 3580,
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\pos\\y": 30,
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\pos\\x": -430,
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\pos\\y": 750,
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\pos\\x": -430,
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\pos\\y": 570,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\pos\\x": 1590,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\pos\\y": 2280,
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\pos\\x": -700,
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\pos\\y": 520,
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\pos\\x": 1870,
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\pos\\y": 1960,
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\pos\\x": 2850,
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\pos\\y": 600,
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\pos\\x": 2190,
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\pos\\y": 520,
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\pos\\x": 870,
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\pos\\y": 160,
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\pos\\x": 3090,
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\pos\\y": -60,
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\pos\\x": 1260,
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\pos\\y": 170,
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\pos\\x": 2370,
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\pos\\y": -10,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\pos\\x": 860,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\pos\\y": 1420,
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\pos\\x": 2680,
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\pos\\y": 980,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\pos\\x": 1230,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\pos\\y": 1450,
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\pos\\x": -270,
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\pos\\y": 140,
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\pos\\x": 2100,
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\pos\\y": 2030,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\pos\\x": 2090,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\pos\\y": -140,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\pos\\x": 90,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\pos\\y": 140,
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\pos\\x": 1520,
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\pos\\y": -110,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\pos\\x": 1780,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\pos\\y": -110,
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\pos\\x": 3130,
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\pos\\y": 640,
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\pos\\x": -720,
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\pos\\y": 750,
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\pos\\x": 2200,
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\pos\\y": 890,
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\pos\\x": 1000,
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\pos\\y": 1200,
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\subject": "AddGold",
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\subject": "Trade",
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\subject": "StartBattle",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options": [
                                    0,
                                    1,
                                    2
                                ],
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options": [
                                    0,
                                    1
                                ],
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options": [
                                    0,
                                    1
                                ],
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options": [
                                    0,
                                    1,
                                    2,
                                    3
                                ],
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in": [
                                    0
                                ],
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\out": [],
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\values\\text": "No! I can give you maps of their camps!..",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\values\\arg2": 100,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\values\\arg2": 100,
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\values\\text": "This... my entire fortune! Okey, take it!",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\values\\text": "There are only sick individuals ib those cages. But you dont't need them, i see... you need the gold?",
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\values\\text": "You're going to pay for this!",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\values\\text": null,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\values\\arg2": 100,
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\values\\text": "You... seriously? Damn, I'm going to regret this...",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\values\\value": 50,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\values\\value": true,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\values\\cover": {
                                    "Dir": null,
                                    "Size": 873748,
                                    "Store": "p-EWvDFxqn",
                                    "Title": "image-cf07fbbd-897b-4930-b2a2-8230d89bdd00.png",
                                    "FileId": "0250e6c2-db77-4a1d-86e6-ec8533fa9bf9"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\values\\cover": {
                                    "Dir": null,
                                    "Size": 950794,
                                    "Store": "p-EWvDFxqn",
                                    "Title": "image-d8dc7456-bb6e-4a57-b477-fac80cd2e72a.png",
                                    "FileId": "4aa7ab82-9792-4835-8fcc-ca98b7834fc7"
                                },
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\0\\next": "bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\1\\next": "6cec17dd-70f8-487d-a251-9da5bc897246",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\2\\next": "fde775bd-fd02-4aa5-b06e-3fcd3fb00c30",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\0\\next": "665ce3d3-8b15-4dd4-ae18-4217b947622a",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\1\\next": null,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\0\\next": "0cecb4b1-6ec4-4109-af04-8fa23e846491",
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\1\\next": "82a82566-d298-40bf-9f68-56c7e8c350b7",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\next": "6fd23b28-909d-4792-ad65-d928d5ee0ca6",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\1\\next": "81bc0688-e661-4aa4-a380-ca59f94821ac",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\next": "0c32ef69-ad39-414d-a93e-8829a61b22e7",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\3\\next": "ffc14f99-c30f-4934-a440-52dae5e93ffe",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\values\\variable": "rage",
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\values\\variable": "rage",
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\values\\arg1\\get": "fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\values\\arg1\\get": "617d6ad2-dd6b-4b93-b558-4067d5c7bd45",
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\values\\arg1\\get": "2589db17-a898-42ae-a088-a4188e4653d5",
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\values\\variable": "rage",
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\values\\variable": "rage",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\values\\quantity": 1000,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\values\\variable": "inspected",
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\values\\variable": "rage",
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\values\\arg1\\get": "c2e413b4-4697-4a03-8aa3-dabf808b95d5",
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\values\\variable": "inspected",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\values\\value\\get": "4dbdca8d-024c-4119-ad84-9d6c8b9158d2",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\name": "quantity",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\type": {
                                    "Type": "integer"
                                },
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\values\\character": {
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\values\\arg1\\param": "result",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\values\\arg1\\param": "result",
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\values\\arg1\\param": "result",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\title": "Quantity",
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\values\\arg1\\param": "result",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " is terrified\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) is terrified\n"
                                },
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\values\\value\\param": "result",
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " is not happy with such an overpriced price\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) is not happy with such an overpriced price\n"
                                },
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " points to the cells\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) points to the cells\n"
                                },
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\values\\description": null,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\values\\description": "You notice narrow dragon cages inside the carts",
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\values\\description": "In one of the cells you notice a very young dragon bleeding.",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\values\\description": "You encounter a caravan of hunters. As you approach, you immediately smell the pungent scent of dragon blood.",
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " is confused\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) is confused\n"
                                },
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\autoFill": null,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\values\\condition\\get": "c58297fc-d71e-46df-886b-0bdb36f4707d",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\0\\values\\text": "Your gold is paid for by the death of my kin. Burn!",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\1\\values\\text": "Your life is worth 1000 coins... And cages with prisoners.",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\2\\values\\text": "Get out! And if i see you again, you won't collect the ashes.",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\0\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Continue inspection",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Continue inspection\n"
                                },
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\1\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "You've seen enough",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "You've seen enough\n"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Trade",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Trade\n"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\1\\values\\text": "Your wagons smell of gunpowder and dragon blood. Where's the loot?",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Take a close look at the carts",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Take a close look at the carts\n"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\3\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Leave them alone",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Leave them alone\n"
                                },
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\0\\values\\value": true,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\1\\values\\value": false,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\values\\condition\\param": "result",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\description": null,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\values\\condition\\get": "4d1cd23f-590f-413e-8867-454a5a0d5be8",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\values\\condition\\get": "49ef00f5-0263-4a4b-9dc4-a0e2e771440e",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\values\\condition\\param": "result",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\values\\condition\\param": "result"
                            },
                            "computed": {
                                "start": "a766bb24-bef9-46ea-965a-0bb88fe5985a",
                                "variables\\own\\rage\\name": "rage",
                                "variables\\own\\rage\\type": {
                                    "Type": "integer"
                                },
                                "variables\\own\\rage\\title": "Rage",
                                "variables\\own\\rage\\autoFill": null,
                                "variables\\own\\inspected\\name": "inspected",
                                "variables\\own\\inspected\\type": {
                                    "Type": "boolean"
                                },
                                "variables\\own\\inspected\\title": "Inspected",
                                "variables\\own\\rage\\description": "In order to engage in battle, you need a sufficient amount of rage",
                                "__settings\\speech\\main\\text\\name": "text",
                                "__settings\\speech\\main\\text\\type": {
                                    "Type": "text"
                                },
                                "variables\\own\\inspected\\autoFill": null,
                                "__settings\\speech\\main\\text\\index": 2,
                                "__settings\\speech\\main\\text\\title": "[[t:Text]]",
                                "__settings\\speech\\option\\text\\name": "text",
                                "__settings\\speech\\option\\text\\type": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\text\\default": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\option\\text\\title": "[[t:Text]]",
                                "variables\\own\\inspected\\description": null,
                                "__settings\\speech\\main\\character\\name": "character",
                                "__settings\\speech\\main\\character\\type": {
                                    "Kind": "dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984",
                                    "Type": "asset"
                                },
                                "__settings\\speech\\option\\text\\default": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\character\\index": 1,
                                "__settings\\speech\\main\\character\\title": "[[t:Character]]",
                                "__settings\\speech\\main\\description\\name": "description",
                                "__settings\\speech\\main\\description\\type": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\text\\description": null,
                                "__settings\\speech\\main\\character\\default": {
                                    "Type": "text"
                                },
                                "__settings\\speech\\main\\description\\index": 0,
                                "__settings\\speech\\main\\description\\title": "Description",
                                "__settings\\speech\\main\\character\\autoFill": true,
                                "__settings\\speech\\option\\text\\description": null,
                                "__settings\\speech\\main\\description\\autoFill": null,
                                "__settings\\speech\\main\\character\\description": null,
                                "__settings\\speech\\main\\description\\description": "What happens behind the scenes?",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\next": "8530b11d-266e-42f1-8d31-f52b1e1eb8e2",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\type": "setVar",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\next": "816917ea-7b9d-4b5e-b73c-555ffe2f8902",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\type": "speech",
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\next": null,
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\type": "getVar",
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\next": null,
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\type": "end",
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\next": null,
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\type": "opNot",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\next": null,
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\type": "opLess",
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\next": null,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\type": "opPlus",
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\next": null,
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\type": "getVar",
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\next": "b1752ca8-318b-41e1-92d2-e9c5cf5a046a",
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\type": "setVar",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\next": "c66949ec-77a9-4749-a056-640637b65692",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\type": "trigger",
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\next": "6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8",
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\type": "speech",
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\next": "c0a0aafb-c8f0-4fe9-b8d5-872730837a46",
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\type": "trigger",
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\next": "43f1325a-d949-4489-9c6a-c3112ae33ee8",
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\type": "trigger",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\next": null,
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\type": "speech",
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\next": "816917ea-7b9d-4b5e-b73c-555ffe2f8902",
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\type": "speech",
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\next": "9c644390-8980-435e-9109-9e95423c5347",
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\type": "setVar",
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\next": null,
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\type": "end",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\next": null,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\type": "speech",
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\next": "c0a0aafb-c8f0-4fe9-b8d5-872730837a46",
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\type": "start",
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\next": "c0a0aafb-c8f0-4fe9-b8d5-872730837a46",
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\type": "speech",
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\next": null,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\type": "branch",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\next": null,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\type": "speech",
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\next": null,
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\type": "getVar",
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\next": null,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\type": "opMore",
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\next": null,
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\type": "end",
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\next": null,
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\type": "getVar",
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\next": "89dfaf94-57fb-44d9-81f8-1cdf85f224c5",
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\type": "speech",
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\next": null,
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\type": "end",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\pos\\x": 590,
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\pos\\y": 1400,
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\pos\\x": 2370,
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\pos\\y": -390,
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\pos\\x": 1230,
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\pos\\y": 2190,
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\pos\\x": 3580,
                                "nodes\\43f1325a-d949-4489-9c6a-c3112ae33ee8\\pos\\y": 30,
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\pos\\x": -430,
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\pos\\y": 750,
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\pos\\x": -430,
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\pos\\y": 570,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\pos\\x": 1590,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\pos\\y": 2280,
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\pos\\x": -700,
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\pos\\y": 520,
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\pos\\x": 1870,
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\pos\\y": 1960,
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\pos\\x": 2850,
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\pos\\y": 600,
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\pos\\x": 2190,
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\pos\\y": 520,
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\pos\\x": 870,
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\pos\\y": 160,
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\pos\\x": 3090,
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\pos\\y": -60,
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\pos\\x": 1260,
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\pos\\y": 170,
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\pos\\x": 2370,
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\pos\\y": -10,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\pos\\x": 860,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\pos\\y": 1420,
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\pos\\x": 2680,
                                "nodes\\89dfaf94-57fb-44d9-81f8-1cdf85f224c5\\pos\\y": 980,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\pos\\x": 1230,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\pos\\y": 1450,
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\pos\\x": -270,
                                "nodes\\a766bb24-bef9-46ea-965a-0bb88fe5985a\\pos\\y": 140,
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\pos\\x": 2100,
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\pos\\y": 2030,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\pos\\x": 2090,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\pos\\y": -140,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\pos\\x": 90,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\pos\\y": 140,
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\pos\\x": 1520,
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\pos\\y": -110,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\pos\\x": 1780,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\pos\\y": -110,
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\pos\\x": 3130,
                                "nodes\\c66949ec-77a9-4749-a056-640637b65692\\pos\\y": 640,
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\pos\\x": -720,
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\pos\\y": 750,
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\pos\\x": 2200,
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\pos\\y": 890,
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\pos\\x": 1000,
                                "nodes\\ffc14f99-c30f-4934-a440-52dae5e93ffe\\pos\\y": 1200,
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\subject": "AddGold",
                                "nodes\\6fd23b28-909d-4792-ad65-d928d5ee0ca6\\subject": "Trade",
                                "nodes\\816917ea-7b9d-4b5e-b73c-555ffe2f8902\\subject": "StartBattle",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options": [
                                    0,
                                    1,
                                    2
                                ],
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options": [
                                    0,
                                    1
                                ],
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options": [
                                    0,
                                    1
                                ],
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options": [
                                    0,
                                    1,
                                    2,
                                    3
                                ],
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in": [
                                    0
                                ],
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\out": [],
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\values\\text": "No! I can give you maps of their camps!..",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\values\\arg2": 100,
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\values\\arg2": 100,
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\values\\text": "This... my entire fortune! Okey, take it!",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\values\\text": "There are only sick individuals ib those cages. But you dont't need them, i see... you need the gold?",
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\values\\text": "You're going to pay for this!",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\values\\text": null,
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\values\\arg2": 100,
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\values\\text": "You... seriously? Damn, I'm going to regret this...",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\values\\value": 50,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\values\\value": true,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\values\\cover": {
                                    "Dir": null,
                                    "Size": 873748,
                                    "Store": "p-EWvDFxqn",
                                    "Title": "image-cf07fbbd-897b-4930-b2a2-8230d89bdd00.png",
                                    "FileId": "0250e6c2-db77-4a1d-86e6-ec8533fa9bf9"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\values\\cover": {
                                    "Dir": null,
                                    "Size": 950794,
                                    "Store": "p-EWvDFxqn",
                                    "Title": "image-d8dc7456-bb6e-4a57-b477-fac80cd2e72a.png",
                                    "FileId": "4aa7ab82-9792-4835-8fcc-ca98b7834fc7"
                                },
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\0\\next": "bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\1\\next": "6cec17dd-70f8-487d-a251-9da5bc897246",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\2\\next": "fde775bd-fd02-4aa5-b06e-3fcd3fb00c30",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\0\\next": "665ce3d3-8b15-4dd4-ae18-4217b947622a",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\1\\next": null,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\0\\next": "0cecb4b1-6ec4-4109-af04-8fa23e846491",
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\1\\next": "82a82566-d298-40bf-9f68-56c7e8c350b7",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\next": "6fd23b28-909d-4792-ad65-d928d5ee0ca6",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\1\\next": "81bc0688-e661-4aa4-a380-ca59f94821ac",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\next": "0c32ef69-ad39-414d-a93e-8829a61b22e7",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\3\\next": "ffc14f99-c30f-4934-a440-52dae5e93ffe",
                                "nodes\\0c32ef69-ad39-414d-a93e-8829a61b22e7\\values\\variable": "rage",
                                "nodes\\2589db17-a898-42ae-a088-a4188e4653d5\\values\\variable": "rage",
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\values\\arg1\\get": "fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\values\\arg1\\get": "617d6ad2-dd6b-4b93-b558-4067d5c7bd45",
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\values\\arg1\\get": "2589db17-a898-42ae-a088-a4188e4653d5",
                                "nodes\\617d6ad2-dd6b-4b93-b558-4067d5c7bd45\\values\\variable": "rage",
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\values\\variable": "rage",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\values\\quantity": 1000,
                                "nodes\\8530b11d-266e-42f1-8d31-f52b1e1eb8e2\\values\\variable": "inspected",
                                "nodes\\c2e413b4-4697-4a03-8aa3-dabf808b95d5\\values\\variable": "rage",
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\values\\arg1\\get": "c2e413b4-4697-4a03-8aa3-dabf808b95d5",
                                "nodes\\fb72e1f8-fc79-4f80-8a1d-f0aca6e5da1b\\values\\variable": "inspected",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\values\\value\\get": "4dbdca8d-024c-4119-ad84-9d6c8b9158d2",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\name": "quantity",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\type": {
                                    "Type": "integer"
                                },
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\values\\character": {
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\values\\character": {
                                    "Name": null,
                                    "Title": "Hunter",
                                    "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                },
                                "nodes\\49ef00f5-0263-4a4b-9dc4-a0e2e771440e\\values\\arg1\\param": "result",
                                "nodes\\4d1cd23f-590f-413e-8867-454a5a0d5be8\\values\\arg1\\param": "result",
                                "nodes\\4dbdca8d-024c-4119-ad84-9d6c8b9158d2\\values\\arg1\\param": "result",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\title": "Quantity",
                                "nodes\\c58297fc-d71e-46df-886b-0bdb36f4707d\\values\\arg1\\param": "result",
                                "nodes\\0cecb4b1-6ec4-4109-af04-8fa23e846491\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " is terrified\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) is terrified\n"
                                },
                                "nodes\\665ce3d3-8b15-4dd4-ae18-4217b947622a\\values\\value\\param": "result",
                                "nodes\\6cec17dd-70f8-487d-a251-9da5bc897246\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " is not happy with such an overpriced price\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) is not happy with such an overpriced price\n"
                                },
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " points to the cells\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) points to the cells\n"
                                },
                                "nodes\\82a82566-d298-40bf-9f68-56c7e8c350b7\\values\\description": null,
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\values\\description": "You notice narrow dragon cages inside the carts",
                                "nodes\\b1752ca8-318b-41e1-92d2-e9c5cf5a046a\\values\\description": "In one of the cells you notice a very young dragon bleeding.",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\values\\description": "You encounter a caravan of hunters. As you approach, you immediately smell the pungent scent of dragon blood.",
                                "nodes\\fde775bd-fd02-4aa5-b06e-3fcd3fb00c30\\values\\description": {
                                    "Ops": [
                                        {
                                            "insert": "Hunter",
                                            "attributes": {
                                                "asset": {
                                                    "icon": "walk-fill",
                                                    "value": {
                                                        "Name": null,
                                                        "Title": "Hunter",
                                                        "AssetId": "bbb048b7-2460-43a8-b6b3-fe50544b9a64"
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "insert": " is confused\n"
                                        }
                                    ],
                                    "Str": "[Hunter](#asset:bbb048b7-2460-43a8-b6b3-fe50544b9a64) is confused\n"
                                },
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\autoFill": null,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\values\\condition\\get": "c58297fc-d71e-46df-886b-0bdb36f4707d",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\0\\values\\text": "Your gold is paid for by the death of my kin. Burn!",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\1\\values\\text": "Your life is worth 1000 coins... And cages with prisoners.",
                                "nodes\\81bc0688-e661-4aa4-a380-ca59f94821ac\\options\\2\\values\\text": "Get out! And if i see you again, you won't collect the ashes.",
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\0\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Continue inspection",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Continue inspection\n"
                                },
                                "nodes\\9c644390-8980-435e-9109-9e95423c5347\\options\\1\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "You've seen enough",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "You've seen enough\n"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Trade",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Trade\n"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\1\\values\\text": "Your wagons smell of gunpowder and dragon blood. Where's the loot?",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Take a close look at the carts",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Take a close look at the carts\n"
                                },
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\3\\values\\text": {
                                    "Ops": [
                                        {
                                            "insert": "Leave them alone",
                                            "attributes": {
                                                "italic": true
                                            }
                                        },
                                        {
                                            "insert": "\n"
                                        }
                                    ],
                                    "Str": "Leave them alone\n"
                                },
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\0\\values\\value": true,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\options\\1\\values\\value": false,
                                "nodes\\bb19fe21-1b7d-412f-b7b8-99fe71bf7e0f\\values\\condition\\param": "result",
                                "nodes\\6aff4f7c-4ccd-44f2-abf1-1633ad35e7a8\\params\\in\\0\\description": null,
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\values\\condition\\get": "4d1cd23f-590f-413e-8867-454a5a0d5be8",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\values\\condition\\get": "49ef00f5-0263-4a4b-9dc4-a0e2e771440e",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\0\\values\\condition\\param": "result",
                                "nodes\\c0a0aafb-c8f0-4fe9-b8d5-872730837a46\\options\\2\\values\\condition\\param": "result"
                            },
                            "inherited": {},
                            "index": 1,
                            "createdAt": "2025-08-08T14:43:27.906Z",
                            "updatedAt": "2025-12-03T06:37:50.944Z",
                            "rights": null
                        },
                        {
                            "id": "00000000-0000-0000-0000-330000000005",
                            "name": "locale",
                            "title": null,
                            "own": true,
                            "type": "locale",
                            "props": {},
                            "computed": {},
                            "inherited": {},
                            "index": 2,
                            "createdAt": "2025-08-08T14:43:27.906Z",
                            "updatedAt": "2025-08-08T14:43:27.906Z",
                            "rights": null
                        },
                        {
                            "id": "00000000-0000-0000-0000-330000000100",
                            "name": "props",
                            "title": "[[t:Properties]]",
                            "own": false,
                            "type": "props",
                            "props": {},
                            "computed": {},
                            "inherited": {},
                            "index": 3,
                            "createdAt": "2025-07-31T12:55:34.293Z",
                            "updatedAt": "2025-07-31T12:55:34.293Z",
                            "rights": null
                        }
                    ],
                    "comments": [],
                    "references": []
                }
            },
            "users": {
                /*"2251": {
                    "id": 2251,
                    "name": "Gogogo"
                }*/
            },
            "assetShorts": {
                "00000000-0000-0000-0000-000000000033": {
                    "id": "00000000-0000-0000-0000-000000000033",
                    "projectId": "111112",
                    "createdAt": undefined, //"2024-02-21T19:42:06.175Z",
                    "creatorUserId": undefined, //null,
                    "deletedAt": undefined, //null,
                    "icon": "file-paper-2-fill",
                    "isAbstract": true,
                    "name": "script",
                    "typeIds": [],
                    //"parentIds": [],
                    "title": "[[t:ScriptElement]]",
                    "updatedAt": undefined, //""2024-02-21T22:44:32.491Z",
                    "workspaceId": "00000000-0000-0000-0000-000000000002",
                    "rights": 1,
                    "unread": 0,
                    //"ownIcon": "file-paper-2-fill",
                    //"ownTitle": "[[t:ScriptElement]]",
                    "index": null,
                    //"lastViewedAt": null,
                    "hasImage": false
                }
            },
            "workspaces": {
                "106688fe-f06c-4a8d-b791-f85e5deb3090": {
                    "id": "106688fe-f06c-4a8d-b791-f85e5deb3090",
                    "title": "Dialogues",
                    "name": null,
                    "projectId": "EWvDFxqn",
                    "parentId": db.RootGddFolder.id,
                    //"createdAt": "2025-08-17T14:53:13.239Z",
                    //"updatedAt": "2025-08-20T09:40:58.369Z",
                    "rights": 5,
                    "unread": 0,
                    "index": -0.3640306,
                    "props": {}
                },
                [db.RootGddFolder.id]: db.RootGddFolder
            }
        },
        "total": 1
    })
})

test('getting short by id', async () => {
    const db = await loadDb();

    const res = await db.asset.assetsGetShort({
       where: {
         "id":["bbb048b7-2460-43a8-b6b3-fe50544b9a64"]
       }
    })

    expect(res).toEqual({
    "list": [
        {
        "id": "bbb048b7-2460-43a8-b6b3-fe50544b9a64",
        "projectId": "EWvDFxqn",
        "typeIds": [
            "dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984",
            "00000000-0000-0000-0000-000000000035"
        ],
        "title": "Hunter",
        "name": null,
        "icon": "walk-fill",
        "isAbstract": false,
        "creatorUserId": undefined, //"2251",
        "createdAt": undefined, //"2025-08-08T14:43:33.525Z",
        "updatedAt": undefined, //"2025-10-07T05:48:55.846Z",
        "deletedAt": undefined, //null,
        "rights": 5,
        "unread": 0,
        "workspaceId": "887cda5d-47ff-475d-9bf5-88d42f24fd7a",
        "index": null,
        "hasImage": true
        }
    ],
    "objects": {
        "workspaces": {
            "0312ebc4-bf36-452a-ac0d-a67023c7ed9f": {
                "id": "0312ebc4-bf36-452a-ac0d-a67023c7ed9f",
                "title": "Characters",
                "name": null,
                "projectId": "EWvDFxqn",
                "parentId": db.RootGddFolder.id,
                //"createdAt": "2025-08-15T12:19:07.727Z",
                //"updatedAt": "2025-08-20T09:20:44.087Z",
                "rights": 5,
                "unread": 0,
                "index": 0.035479072,
                "props": {}
            },
            "887cda5d-47ff-475d-9bf5-88d42f24fd7a": {
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
            [db.RootGddFolder.id]: db.RootGddFolder
        },
        "users": {
        }
    },
    "total": 1
    })
})


test('getting short by type and workspace', async() => {
    const db = await loadDb();

    const res = await db.asset.assetsGetShort({
        where: {
            "typeids":"dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984",
            "workspaceId":"887cda5d-47ff-475d-9bf5-88d42f24fd7a"
        }
    })

    expect(res).toEqual({
        "list": [
            {
                "id": "bbb048b7-2460-43a8-b6b3-fe50544b9a64",
                "projectId": "EWvDFxqn",
                "typeIds": [
                    "dcb5d0aa-b55a-4a63-9d85-7cdb6b53e984",
                    "00000000-0000-0000-0000-000000000035"
                ],
                "title": "Hunter",
                "name": null,
                "icon": "walk-fill",
                "isAbstract": false,
                "creatorUserId": undefined, //"2251",
                "createdAt": undefined, //"2025-08-08T14:43:33.525Z",
                "updatedAt": undefined, //"2025-10-07T05:48:55.846Z",
                "deletedAt": undefined, //null,
                "rights": 5,
                "unread": 0,
                "workspaceId": "887cda5d-47ff-475d-9bf5-88d42f24fd7a",
                "index": null,
                "hasImage": true
            }
        ],
        "objects": {
            "workspaces": {
                "0312ebc4-bf36-452a-ac0d-a67023c7ed9f": {
                    "id": "0312ebc4-bf36-452a-ac0d-a67023c7ed9f",
                    "title": "Characters",
                    "name": null,
                    "projectId": "EWvDFxqn",
                    "parentId": db.RootGddFolder.id,
                    //"createdAt": "2025-08-15T12:19:07.727Z",
                    //"updatedAt": "2025-08-20T09:20:44.087Z",
                    "rights": 5,
                    "unread": 0,
                    "index": 0.035479072,
                    "props": {}
                },
                "887cda5d-47ff-475d-9bf5-88d42f24fd7a": {
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
                [db.RootGddFolder.id]: db.RootGddFolder
            },
            "users": {
            }
        },
        "total": 1
    })
})



test('getting root gdd assets', async() => {
    const db = await loadDb();

    const res = await db.asset.assetsGetShort({
        where: {
            "workspaceId":db.RootGddFolder.id,
            issystem: false
        }
    })

    expect(res).toEqual({
    list: [
        {
        id: "fb010b0c-6dac-4090-9055-4406f0123ba7",
        createdAt: undefined,
        icon: "information-fill",
        isAbstract: false,
        name: null,
        typeIds: [
        ],
        unread: 0,
        rights: 5,
        deletedAt: undefined,
        title: "Game Overview",
        updatedAt: undefined,
        workspaceId: "00000000-0000-0000-0000-000000000002",
        index: 2,
        creatorUserId: undefined,
        projectId: "EWvDFxqn",
        hasImage: false,
        },
        {
        id: "5ad7411b-be83-43c4-88f3-1dca82a1d852",
        createdAt: undefined,
        icon: "flag-2-fill",
        isAbstract: false,
        name: "index",
        typeIds: [
        ],
        unread: 0,
        rights: 5,
        deletedAt: undefined,
        title: "Welcome! 🎉",
        updatedAt: undefined,
        workspaceId: "00000000-0000-0000-0000-000000000002",
        index: 1,
        creatorUserId: undefined,
        projectId: "EWvDFxqn",
        hasImage: false,
        },
    ],
    objects: {
        workspaces: {
            "00000000-0000-0000-0000-000000000002": {
                id: "00000000-0000-0000-0000-000000000002",
                index: null,
                title: "[[t:Gdd]]",
                name: "gdd",
                parentId: null,
                projectId: "EWvDFxqn",
                props: {
                },
                createdAt: "",
                updatedAt: "",
                rights: 4,
                unread: 0,
            },
        },
        users: {
        },
    },
    total: 2,
    })
})