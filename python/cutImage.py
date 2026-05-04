from PIL import Image
import os
from pathlib import Path

def split_image_9parts(input_folder, output_folder=None):
    """
    指定フォルダ内の1024x1024画像を9等分に分割

    Args:
        input_folder: 入力画像フォルダのパス
        output_folder: 出力フォルダのパス (Noneの場合は入力フォルダ内に'split'フォルダを作成)
    """
    # 入力フォルダのパス設定
    input_path = Path(input_folder)

    # 出力フォルダの設定
    if output_folder is None:
        output_path = input_path / 'split'
    else:
        output_path = Path(output_folder)

    # 出力フォルダが存在しない場合は作成
    output_path.mkdir(parents=True, exist_ok=True)

    # 対応する画像拡張子
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff'}

    # 画像ファイルを取得して昇順にソート
    image_files = sorted([
        f for f in input_path.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ])

    if not image_files:
        print(f"警告: {input_folder} に画像ファイルが見つかりません")
        return

    print(f"{len(image_files)}枚の画像を処理します\n")

    # 各画像を処理
    for img_file in image_files:
        try:
            # 画像を開く
            img = Image.open(img_file)
            width, height = img.size

            # サイズチェック
            if width != 1024 or height != 1024:
                print(f"スキップ: {img_file.name} (サイズ: {width}x{height})")
                continue

            # 元のファイル名(拡張子なし)
            base_name = img_file.stem
            extension = img_file.suffix

            # 各セクションのサイズを計算(1024÷3 ≈ 341.33)
            section_width = width // 3
            section_height = height // 3

            # 9つに分割
            positions = [
                (0, 0, section_width, section_height),           # 1: 上段左
                (section_width, 0, section_width*2, section_height),  # 2: 上段中
                (section_width*2, 0, width, section_height),     # 3: 上段右
                (0, section_height, section_width, section_height*2),  # 4: 中段左
                (section_width, section_height, section_width*2, section_height*2),  # 5: 中段中
                (section_width*2, section_height, width, section_height*2),  # 6: 中段右
                (0, section_height*2, section_width, height),    # 7: 下段左
                (section_width, section_height*2, section_width*2, height),  # 8: 下段中
                (section_width*2, section_height*2, width, height)  # 9: 下段右
            ]

            # 各部分を切り出して保存
            for i, (left, top, right, bottom) in enumerate(positions, start=1):
                cropped = img.crop((left, top, right, bottom))
                output_filename = f"{base_name}_{i}{extension}"
                output_filepath = output_path / output_filename
                cropped.save(output_filepath)

            print(f"✓ 処理完了: {img_file.name} → {base_name}_1〜9{extension}")

        except Exception as e:
            print(f"✗ エラー: {img_file.name} - {str(e)}")

    print(f"\n全ての処理が完了しました")
    print(f"出力先: {output_path}")


if __name__ == "__main__":
    # 使用例
    input_folder = "../images"  # 入力フォルダのパスを指定

    # 実行
    split_image_9parts(input_folder, output_folder="../public/images/outputImages")

    # 出力先を指定する場合:
    # split_image_9parts(input_folder, output_folder="./output")
