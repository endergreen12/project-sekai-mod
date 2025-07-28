import "frida-il2cpp-bridge"

const enableThirdPerson = false
export function AttachCameraToCharacterModel(camera: Il2Cpp.Object, characterModel: Il2Cpp.Object)
{
    const cameraTransform = camera.method<Il2Cpp.Object>("get_transform").invoke()
    cameraTransform.method("SetParent", 1).invoke(characterModel.method<Il2Cpp.Object>(`get_${enableThirdPerson ? "PositionNote" : "HeadTransform"}`).invoke())

    const Vector3Class = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Vector3")
    const localPosition = Vector3Class.alloc()
    const localEulerAngles = Vector3Class.alloc()
    if(enableThirdPerson)
    {
        localPosition.method(".ctor", 3).invoke(0.0, 0.6, 1.5)
        localEulerAngles.method(".ctor", 3).invoke(180.0, 0.0, 180.0)
    } else {
        localPosition.method(".ctor", 3).invoke(-0.05, 0.0, 0.0)
        localEulerAngles.method(".ctor", 3).invoke(0.0, 0.0, 90.0)
    }
    cameraTransform.method("set_localPosition").invoke(localPosition.unbox())
    cameraTransform.method("set_localEulerAngles").invoke(localEulerAngles.unbox())

    if(enableThirdPerson)
    {
        return
    }

    camera.method("set_nearClipPlane").invoke(0.01)
    characterModel.method<Il2Cpp.Object>("get_Face").invoke().method("SetActive").invoke(false)
    characterModel.method<Il2Cpp.Object>("get_Hair").invoke().method("SetActive").invoke(false)
}

export function ChangeFOV()
{
    const assembly = Il2Cpp.domain.assembly("Assembly-CSharp").image

    assembly.class("Sekai.Core.SekaiCameraAspect").method("CalculateVerticalFov").implementation = function(currentFov: number)
    {
        return 70 // オーバーライドするFOVの値(100を超えたあたりからキャラクターのアウトラインがめっちゃ太くなるので注意)
    }
}