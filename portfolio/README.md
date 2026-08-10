# 포트폴리오 덱

`slides.html`이 최종 결과물이다. 스크린샷이 base64로 박혀 있어 **파일 하나만 있으면 브라우저에서 바로 열린다.**

```
slides.template.html   편집하는 원본 (이미지 자리는 __IMG_*__ 토큰)
shots/                 앱 스크린샷 (.jpg — 빌드 시 인라인됨)
build.mjs              템플릿 + shots → slides.html
capture.mjs            실행 중인 앱에서 스크린샷 다시 찍기
slides.html            생성물 (직접 편집하지 말 것)
```

## 내용만 고칠 때

`slides.template.html`을 수정하고:

```bash
node portfolio/build.mjs
```

## 스크린샷을 다시 찍을 때

UI가 바뀌어서 화면을 갱신해야 하면, 개발 서버를 띄운 뒤:

```bash
node portfolio/capture.mjs
```

`shots/`에 PNG가 생긴다. 그대로 쓰면 덱이 3MB를 넘으므로 JPEG으로 줄인 뒤 빌드한다
(Windows PowerShell 기준, 폭 620px / 품질 82로 약 440KB):

```powershell
Add-Type -AssemblyName System.Drawing
$dir = "portfolio\shots"
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82
foreach ($n in @('01-map','02-selected','04-list','05-directions')) {
  $src = [System.Drawing.Image]::FromFile("$PWD\$dir\$n.png")
  $h = [int]($src.Height * 620 / $src.Width)
  $bmp = New-Object System.Drawing.Bitmap 620, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, 620, $h)
  $bmp.Save("$PWD\$dir\$n.jpg", $codec, $params)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}
```

## 알아둘 점

- `slides.html`에는 `<!doctype>`/`<head>`가 없다. 호스팅 쪽에서 감싸주는 구조라 그렇다.
  **로컬에서 파일을 직접 열면 한글이 깨지고 모바일 폭이 틀어진다** — charset·viewport 메타가 없기 때문이며 덱이 잘못된 게 아니다.
  로컬에서 제대로 보려면 `<meta charset="utf-8">`와 viewport를 넣은 래퍼로 감싸서 열 것.
- 스크린샷은 `deviceScaleFactor: 2`로 찍어 2배 해상도다. 덱에서는 210px 폭으로 표시된다.
