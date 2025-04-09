import base64

# Path to your PDF file
pdf_file_path = "resources/pdf/introdutione-seconda.pdf"
# Path to output the Base64 encoded data
output_file_path = "resources/base64/introdutione-seconda.js"

# Open the PDF file in binary mode and encode it to Base64
with open(pdf_file_path, "rb") as pdf_file:
    pdf_base64 = base64.b64encode(pdf_file.read()).decode("utf-8")

# Clean the Base64 string to remove any newlines or spaces
clean_pdf_base64 = pdf_base64.replace('\n', '').replace('\r', '')

# Write the cleaned Base64 string to the output file
with open(output_file_path, "w") as output_file:
    output_file.write("const pdfBase64 = '" + clean_pdf_base64 + "';")

print(f"Base64 encoded PDF saved to {output_file_path}")
