import base64
import os
import re
import random
import string
import json

folder = r"D:\PianoBingo\utils\songs"
output_file_path = os.path.join(os.path.dirname(__file__), "../resources/base64/pack_tom.js")

pattern = re.compile(r'^(\d+)\.\s*(.+)\.pdf$', re.I)

files_info = []

# Step 1: Collect all files with number and name, sorted by number
for filename in os.listdir(folder):
    if filename.lower().endswith('.pdf'):
        match = pattern.match(filename)
        if match:
            number = int(match.group(1))
            name = match.group(2)
            full_path = os.path.join(folder, filename)
            files_info.append((number, name, full_path))
        else:
            print(f"Skipped (pattern not matched): {filename}")

files_info.sort(key=lambda x: x[0])  # Sort by number

# Helper: generate a random JS variable name (must start with letter or _)
def random_js_var(length=8):
    chars = string.ascii_letters + string.digits
    first_char = random.choice(string.ascii_letters + "_")
    rest = ''.join(random.choices(chars, k=length-1))
    return first_char + rest

js_lines = []
songs_array = []

for idx, (number, name, path) in enumerate(files_info, start=1):
    with open(path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8").replace('\n', '').replace('\r', '')
    var_name = random_js_var()
    # Write the base64 const line
    js_lines.append(f"const {var_name} = '{encoded}'; // {number}. {name}")

    # Add entry for the songs array, pdfUrl is the variable name as a string
    songs_array.append({
        "id": number,
        "title": name,
        "pdfUrl": var_name
    })

# Build the pack object as a JS constant
pack_obj = {
    "packName": "Tom",
    "packId": 1,
    "songCount": len(songs_array),
    "songs": songs_array
}

# Convert the pack object to JS syntax with unquoted keys for top-level keys
# but we want pdfUrl values NOT quoted again because they are variable names in JS, not strings
# So we will manually build the pack JS code string:

def to_js_object(obj):
    # custom converter to JS object literal
    lines = []
    lines.append("{")
    lines.append(f"  packName: \"{obj['packName']}\",")
    lines.append(f"  packId: {obj['packId']},")
    lines.append(f"  songCount: {obj['songCount']},")
    lines.append(f"  songs: [")
    for song in obj['songs']:
        lines.append("    {")
        lines.append(f"      id: {song['id']},")
        lines.append(f"      title: \"{song['title']}\",")
        # pdfUrl should be the variable name *without quotes*
        lines.append(f"      pdfUrl: {song['pdfUrl']}")
        lines.append("    },")
    lines.append("  ]")
    lines.append("}")
    return "\n".join(lines)

pack_js = "const pack = " + to_js_object(pack_obj) + ";"

# Write everything to the JS file
with open(output_file_path, "w", encoding="utf-8") as out_file:
    # base64 vars first
    out_file.write("\n".join(js_lines))
    out_file.write("\n\n")
    # pack object last

print(pack_js)

print(f"Encoded {len(js_lines)} PDFs and wrote pack data to {output_file_path}")
