import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { fileTypeFromBuffer } from "file-type";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem fazer upload de arquivos.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar tipo real do arquivo usando file-type
    const fileType = await fileTypeFromBuffer(buffer);
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!fileType || !validMimeTypes.includes(fileType.mime)) {
      return NextResponse.json(
        {
          error:
            "Tipo de arquivo inválido ou não permitido. Use JPG, PNG, WEBP ou GIF",
        },
        { status: 400 }
      );
    }

    // Converter buffer para base64
    const base64Image = `data:${fileType.mime};base64,${buffer.toString("base64")}`;

    // Upload para Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "produtos",
      resource_type: "image",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    );
  }
}
