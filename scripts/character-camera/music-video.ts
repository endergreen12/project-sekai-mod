import "frida-il2cpp-bridge"
import { AttachCameraToCharacterModel, ChangeFOV } from "./logic"

Il2Cpp.perform(() => {
    ChangeFOV()

    const assembly = Il2Cpp.domain.assembly("Assembly-CSharp").image

    assembly.class("Sekai.Core.MVDataLoader").method<Il2Cpp.Object>("LoadTimelineAsset").implementation = function(timelineName: Il2Cpp.String, mvId: number)
    {
        const loadedTimelineAsset = this.method<Il2Cpp.Object>("LoadTimelineAsset").invoke(timelineName, mvId)
        const trackObjects = loadedTimelineAsset.method<Il2Cpp.Object>("get_trackObjects").invoke()
        const trackObjectsArrayConverted = trackObjects.method<Il2Cpp.Array<Il2Cpp.Object>>("ToArray").invoke()

        switch(timelineName.toString())
        {
            case '"Camera"': // MainCameraトラックをカメラタイムラインから除去する
                for(let i = trackObjectsArrayConverted.length - 1; i > -1; i--)
                {
                    const trackObj = trackObjectsArrayConverted.get(i)
                    if(!trackObj.isNull() && trackObj.method<Il2Cpp.String>("get_name").invoke().toString() === '"MainCamera"')
                    {
                        trackObjects.method("RemoveAt").invoke(i)
                    }
                }
                break

            case '"Character"': // MeshOffトラックを除去
                for(let i = trackObjectsArrayConverted.length - 1; i > -1; i--)
                {
                    const trackObj = trackObjectsArrayConverted.get(i)
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