import csv
import os
from collections import defaultdict
from pathlib import Path
import re
from pykakasi import kakasi

# pykakasi の初期化
kks = kakasi()

def add_ruby_to_kanji(text):
    """漢字のみにルビを振る"""
    ruby_text = ""

    for char in text:
        # 改行や空白はそのまま
        if char in ['\n', '\r', '\t', ' ', '　']:
            ruby_text += char
            continue

        result = kks.convert(char)

        if result:
            item = result[0]
            orig = item['orig']
            hira = item['hira']

            # 漢字かどうかを判定
            if orig != hira and re.search(r'[\u4e00-\u9fff]', orig):
                ruby_text += f'<ruby>{orig}<rt style={{{{ fontSize: "0.5em" }}}}>{hira}</rt></ruby>'
            else:
                ruby_text += orig
        else:
            ruby_text += char

    return ruby_text

def read_csv_file(filename):
    """CSVファイルを読み込んで単語データを返す"""
    words_by_length = defaultdict(list)

    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 4:
                english_word = row[0].strip()
                meaning = row[1].strip()
                usage = row[2].strip()
                char_count = row[3].strip()

                try:
                    char_count = int(char_count)
                    words_by_length[char_count].append({
                        'en': english_word,
                        'ja': meaning,
                        'usage': usage
                    })
                except ValueError:
                    print(f"警告: 文字数が数値ではありません: {row}")
                    continue

    return words_by_length

def generate_ts_content(words, char_count, file_number, all_images):
    """TypeScriptファイルの内容を生成"""
    file_number_str = str(file_number).zfill(2)
    var_name = f"characterCount{char_count}_no{file_number_str}"

    content = f'import type {{ QAPair }} from "@/types/index";\n\n'
    content += f'const {var_name}: QAPair[] = [\n'

    for word in words:
        ja_text = word["ja"]

        # ①②③などの丸数字の前に改行を追加
        ja_text = re.sub(r'([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])', r'\n\1', ja_text)

        # 改行の直前の空白（全角・半角）を削除
        ja_text = re.sub(r'[ 　]+\n', '\n', ja_text)

        # 先頭の改行を削除（最初に丸数字がある場合の対策）
        ja_text = ja_text.lstrip('\n')

        # 漢字にルビを振る
        ja_text_with_ruby = add_ruby_to_kanji(ja_text)

        # 改行を<br />に変換（ルビ振り後）
        ja_text_with_ruby = ja_text_with_ruby.replace('\r\n', '<br />').replace('\n', '<br />')

        # プレーンテキスト用（ルビなし）
        ja_plain_text = ja_text.replace('\r\n', '\\n').replace('\n', '\\n')

        # 画像パスを取得（wordに既に割り当てられている）
        img_path = word.get("img", "")

        content += '  {\n'
        content += f'    ja: <>{ja_text_with_ruby}</>,\n'
        content += f'    jaPlain: "{ja_plain_text}",\n'
        content += f'    en: "{word["en"]}",\n'
        content += f'    img: "{img_path}",\n'
        content += '  },\n'

    content += '];\n\n'
    content += f'export default {var_name};\n'

    return content

def generate_route_points(file_info_list, output_dir):
    """ルートポイント定義ファイルを生成"""
    content = 'import type { MapPoint } from "@/types/index";\n'

    # import文を生成
    for info in file_info_list:
        var_name = info['var_name']
        content += f'import {var_name} from "./texts/{var_name}";\n'

    content += '\nexport const TYPING_ROUTE_POINTS: MapPoint[] = [\n'

    # MapPointの配列を生成
    for idx, info in enumerate(file_info_list, start=1):
        char_count = info['char_count']
        file_number = info['file_number']
        var_name = info['var_name']

        content += f'  {{ id: {idx}, titleRaw: "{char_count}文字", title: \'<span>{char_count}<ruby>文字<rt  style="font-size: 0.5em">もじ</rt></ruby> No.{file_number:02d}</span>\', QA: {var_name} }},\n'

    content += '];\n'

    # ファイルに書き込み
    filepath = os.path.join(output_dir,'../', 'points.tsx')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"\nルートポイント定義ファイルを作成: points.tsx")
    print(f"  - 合計 {len(file_info_list)} ポイント")

def create_ts_files(words_by_length, output_dir='../src/data/texts', image_dir='../public/images/outputImages'):
    """文字数ごとにTSファイルを生成"""
    # 出力ディレクトリを作成
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 画像ファイルを取得（昇順でソート）
    image_paths = []
    if os.path.exists(image_dir):
        image_files = set()  # 重複を防ぐためにsetを使用
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.webp', '*.svg',
                    '*.JPG', '*.JPEG', '*.PNG', '*.GIF', '*.WEBP', '*.SVG']:
            for f in Path(image_dir).glob(ext):
                image_files.add(f.name)

        # ファイル名でソート
        image_paths = sorted(list(image_files))
        print(f"\n画像ファイルを検出: {len(image_paths)}枚")
        if len(image_paths) > 0:
            print(f"最初の画像: {image_paths[0]}")
            print(f"最後の画像: {image_paths[-1]}\n")
    else:
        print(f"\n警告: 画像ディレクトリ '{image_dir}' が見つかりません。画像なしで生成します。")

    # 全ての単語に画像を事前に割り当て
    image_index = 0
    total_words = sum(len(words) for words in words_by_length.values())

    for char_count in sorted(words_by_length.keys()):
        words = words_by_length[char_count]
        for word in words:
            if image_index < len(image_paths):
                word['img'] = f"./images/outputImages/{image_paths[image_index]}"
                image_index += 1
            else:
                word['img'] = ""


    total_files = 0
    file_info_list = []  # ファイル情報を保存

    # 文字数ごとに処理
    for char_count in sorted(words_by_length.keys()):
        words = words_by_length[char_count]

        # 10行ずつに分割
        for i in range(0, len(words), 10):
            chunk = words[i:i+10]
            file_number = (i // 10) + 1
            file_number_str = str(file_number).zfill(2)

            # ファイル名を生成
            filename = f"characterCount{char_count}_no{file_number_str}.tsx"
            filepath = os.path.join(output_dir, filename)

            # TypeScriptファイルを生成
            ts_content = generate_ts_content(chunk, char_count, file_number, image_paths)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(ts_content)

            total_files += 1
            # 使用した画像の数を表示
            images_in_chunk = sum(1 for w in chunk if w.get('img', ''))
            print(f"作成: {filename} ({len(chunk)}単語, 画像{images_in_chunk}枚)")

            # ファイル情報を保存
            file_info_list.append({
                'char_count': char_count,
                'file_number': file_number,
                'file_number_str': file_number_str,
                'var_name': f"characterCount{char_count}_no{file_number_str}"
            })

    print(f"\n単語総数: {total_words}個")
    print(f"画像割り当て完了: {min(image_index, len(image_paths))}枚使用\n")
    print(f"合計 {total_files} ファイルを作成しました")
    print(f"使用した画像: {min(image_index, len(image_paths))} / {len(image_paths)}枚")

    if image_index > len(image_paths):
        print(f"注意: 画像が不足しています。{image_index - len(image_paths)}個の単語に画像が割り当てられませんでした。")

    # ルートポイント定義を生成
    generate_route_points(file_info_list, output_dir)

def main():
    # CSVファイル名を指定
    csv_filename = 'r6_eitangosyu_2.csv'

    print(f"CSVファイルを読み込み中: {csv_filename}")

    try:
        words_by_length = read_csv_file(csv_filename)

        # 最長の意味を見つける
        max_length = 0
        max_word = None
        max_file = None

        for char_count in sorted(words_by_length.keys()):
            words = words_by_length[char_count]
            for i, word in enumerate(words):
                ja_length = len(word['ja'])
                if ja_length > max_length:
                    max_length = ja_length
                    max_word = word
                    file_number = (i // 10) + 1
                    file_number_str = str(file_number).zfill(2)
                    max_file = f"characterCount{char_count}_no{file_number_str}.ts"

        print(f"\nTypeScriptファイルを生成中...")
        create_ts_files(words_by_length)

        print(f"\n文字数別の単語数:")
        for char_count in sorted(words_by_length.keys()):
            print(f"  {char_count}文字: {len(words_by_length[char_count])}単語")

        print(f"\n最長の意味:")
        print(f"  ファイル: {max_file}")
        max_word = max_word or {}
        print(f"  英単語: {max_word.get('en', 'データなし')}")
        print(f"  意味: {max_word.get('ja', 'データなし')}")
        print(f"  文字数: {max_length}文字")

        print("\n処理が完了しました!")

    except FileNotFoundError:
        print(f"エラー: ファイル '{csv_filename}' が見つかりません")
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()
