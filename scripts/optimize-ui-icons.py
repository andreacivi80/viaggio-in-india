from pathlib import Path
from PIL import Image


def optimize(path: Path) -> None:
    with Image.open(path) as source:
        image = source.convert("RGBA")
        bounds = image.getbbox()
        if bounds:
            image = image.crop(bounds)
        image.thumbnail((176, 176), Image.Resampling.LANCZOS)
        output = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
        output.alpha_composite(image, ((192 - image.width) // 2, (192 - image.height) // 2))
        output.save(path, optimize=True)


if __name__ == "__main__":
    ui_directory = Path(__file__).resolve().parents[1] / "public" / "ui"
    for name in ("sunrise.png", "sunset.png"):
        optimize(ui_directory / name)
