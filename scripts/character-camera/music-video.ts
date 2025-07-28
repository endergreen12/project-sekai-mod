import "frida-il2cpp-bridge"
import { AttachCameraToCharacterModel, ChangeFOV } from "./logic"

Il2Cpp.perform(() => {
    ChangeFOV()

    const assembly = Il2Cpp.domain.assembly("Assembly-CSharp").image

    assembly.class("Sekai.Core.MVDataLoader").method<Il2Cpp.Object>("LoadTimelineAsset").implementation = function(timelineName: Il2Cpp.String, mvId: number)
    {
        const loadedTimelineAsset = this.method<Il2Cpp.Object>("LoadTimelineAsset").invoke(timelineName, mvId)
        const trackObjects = loadedTimelineAsset.method<Il2Cpp.Object>("get_trackObjects").invoke()
        const trackObjectsArray = trackObjects.method<Il2Cpp.Array<Il2Cpp.Object>>("ToArray").invoke()

        switch(timelineName.toString())
        {
            case '"Camera"': // MainCameraのアニメーションとDoFトラックを削除
                for(let i = trackObjectsArray.length - 1; i > -1; i--)
                {
                    const trackObj = trackObjectsArray.get(i)

                    if(!trackObj.isNull())
                    {
                        const name = trackObj.method<Il2Cpp.String>("get_name").invoke().toString()

                        if(name === '"MainCamera"' || name.toLocaleLowerCase().includes("dof"))
                        {
                            trackObjects.method("RemoveAt").invoke(i)
                        } else if(name.toLocaleLowerCase().includes("effect")) // Effect GroupからDoFトラックを除去、小文字にしてincludesで判定しているのはMVによって大文字だったり小文字だったりするため
                        {
                            const children = trackObj.field<Il2Cpp.Object>("m_Children").value
                            const childrenArray = children.method<Il2Cpp.Array<Il2Cpp.Object>>("ToArray").invoke()
                            for(let j = childrenArray.length - 1; j > -1; j--)
                            {
                                if(childrenArray.get(j).method<Il2Cpp.String>("get_name").invoke().toString().toLocaleLowerCase().includes("dof"))
                                {
                                    children.method("RemoveAt").invoke(j)
                                }
                            }
                        }
                    }
                }
                break

            case '"Character"': // MeshOffトラックを除去
                for(let i = trackObjectsArray.length - 1; i > -1; i--)
                {
                    const trackObj = trackObjectsArray.get(i)
                    if(!trackObj.isNull() && trackObj.method<Il2Cpp.String>("get_name").invoke().toString().includes("MeshOff"))
                    {
                        trackObjects.method("RemoveAt").invoke(i)
                    }
                }
                break
        }

        return loadedTimelineAsset
    }

    assembly.class("Sekai.Live.Background3DPlayer").method("MusicStart").implementation = function(time: number)
    {
        this.method("MusicStart").invoke(time)

        const mvModelInstance = assembly.class("Sekai.Live.Model.MusicVideoModel").method<Il2Cpp.Object>("get_Instance").invoke()
        const mainCamera = mvModelInstance.method<Il2Cpp.Object>("get_MainCameraModel").invoke()
                            .field<Il2Cpp.Object>("MainCameraModel").value
                            .field<Il2Cpp.Object>("MainCamera").value
        const characterModel = mvModelInstance.method<Il2Cpp.Object>("get_MainCharacterModel").invoke()
                            .field<Il2Cpp.Array<Il2Cpp.Object>>("characterModelList").value
                            .get(0) // 一人称にするキャラクターのインデックス
        
        AttachCameraToCharacterModel(mainCamera, characterModel)
    }

    // CameraDecorationを無効化
    assembly.class("Sekai.Live.Background3DPlayer").method("Setup").implementation = function(isCreateNode: boolean, mvData: Il2Cpp.Object)
    {
        mvData.field<Il2Cpp.Object>("cameraInfo").value.field<boolean>("hasCameraDecoration").value = false
        this.method("Setup").invoke(isCreateNode, mvData)
    }
})