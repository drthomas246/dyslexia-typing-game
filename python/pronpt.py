import csv

def generate_prompts(csv_file_path, output_file_path):
    """
    CSVファイルを9行ずつ読み取り、AI画像生成用のプロンプトを作成する

    Args:
        csv_file_path: 入力CSVファイルのパス
        output_file_path: 出力テキストファイルのパス（デフォルト: data.txt）
    """

    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.reader(csv_file)

            # ヘッダー行がある場合はスキップ（必要に応じて調整）
            # next(csv_reader, None)

            rows = list(csv_reader)

        with open(output_file_path, 'w', encoding='utf-8') as output_file:
            # 9行ずつ処理
            for i in range(0, len(rows), 9):
                batch = rows[i:i+9]

                # 9行未満の場合は空欄で埋める
                while len(batch) < 9:
                    batch.append(['', '', ''])  # 空欄行を追加

                # プロンプト作成
                prompt = "イラストの上段左、上段中、上段右、中段左、中段中、中段右、下段左、下段中、下段右を①、②、③、④、⑤、⑥、⑦、⑧、⑨とする。\n"
                prompt += "学習教材向けの、子ども向けアニメ風のカラーイラストを丸番号ごとに1枚ずつ作成。\n"
                prompt += "背景は白〜淡色でシンプル、主題を中央に大きく、余白多め、アイコン的で分かりやすく。 文字・英語・日本語・記号など、いかなるテキストも画像内に入れない。丸番号も入れない。（看板や本の表紙文字も禁止）。次の『意味』から連想される情景を描く。意味から難しければ『用例』の状況を絵にする。\n"

                # 各単語の情報を追加
                circle_numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']
                for idx, row in enumerate(batch):
                    if len(row) >= 3:
                        word = row[0]
                        meaning = row[1].strip()
                        example = row[2].strip()  # 改行のみの場合を除去

                        prompt += f"{circle_numbers[idx]}\n"
                        prompt += f"単語: {word}\n"
                        prompt += f"意味: {meaning}\n"
                        prompt += f"用例: {example}\n"

                prompt += "画像は正方形にすること"

                # ファイルに書き込み
                output_file.write(prompt)

                # 最後のバッチでなければ空行を追加
                if i + 9 < len(rows):
                    output_file.write("\n\n")

        print(f"処理完了: {output_file_path} に保存されました。")
        print(f"処理された行数: {min(len(rows), (len(rows) // 9) * 9)}行")
        print(f"生成されたプロンプト数: {len(rows) // 9}個")

    except FileNotFoundError:
        print(f"エラー: ファイル '{csv_file_path}' が見つかりません。")
    except Exception as e:
        print(f"エラーが発生しました: {e}")


# 使用例
if __name__ == "__main__":
    # CSVファイルのパスを指定してください
    csv_file = "r6_eitangosyu_2.csv"  # ここにCSVファイル名を入力
    output_file = "data.txt"

    generate_prompts(csv_file, output_file)
