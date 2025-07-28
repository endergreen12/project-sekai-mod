import "frida-il2cpp-bridge"
import { AttachCameraToCharacterModel, ChangeFOV } from "./logic"

Il2Cpp.perform(() => {
    ChangeFOV()

    const assembly = Il2Cpp.domain.assembly("Assembly-CSharp").image

    // MainCameraトラックをカメラタイムラインから除去する
    assembly.class("Sekai.Core.MVDataLoader").method<Il2Cpp.Object>("LoadTimelineAsset").implementation = function(timelineName: Il2Cpp.String, mvId: number)
    {
        const loadedTimelineAsset = this.method<Il2Cpp.Object>("LoadTimelineAsset").invoke(timelineName, mvId)
        
        if(timelineName.toString() === '"Camera"')
        {
            const trackObjects = loadedTimelineAsset.method<Il2Cpp.Object>("get_trackObjects").invoke()
            // trackObjectsはList型で、frida-il2cpp-bridgeにおいてListから要素を取得するのはくそめんどくさいので配列型に変換したものを参考にしながらtrackObjectsを操作する
            const trackObjectsArrayConverted = trackObjects.method<Il2Cpp.Array<Il2Cpp.Object>>("ToArray").invoke()
            
            // trackObjectsを操作していくが、もし配列の最初からにすると要素を消していくうちに長さが変わってしまうので配列の最後からやる
            for(let i = trackObjectsArrayConverted.length - 1; i > -1 ; i--)
            {
                const trackObj = trackObjectsArrayConverted.get(i)
                if(!trackObj.isNull() && trackObj.method<Il2Cpp.String>("get_name").invoke().toString() === '"MainCamera"')
                {
                    trackObjects.method("RemoveAt").invoke(i)
                }
            }
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

    // CharacterModelのMeshOffStateの切り替えを無効化
    assembly.class("Sekai.Core.CharacterModel").method("UpdateMeshViewTimeline").implementation = function(){}

    const SekaiPostProcessPass = Il2Cpp.domain.assembly("Unity.RenderPipelines.Universal.Runtime").image.class("Sekai.Rendering.PostPrcessV2.SekaiPostProcessPass")
    // SekaiDofを無効化
    SekaiPostProcessPass.method("UpdateSekaiDof").implementation = function(){}
    // フェードを無効化
    SekaiPostProcessPass.method("UpdateFadeOutBeforeProp").implementation = function(){}
})