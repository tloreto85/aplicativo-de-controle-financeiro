import { generateText, Output } from "ai"
import { z } from "zod"

export const maxDuration = 60

const itemsSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Nome do produto"),
      category: z.string().describe("Categoria do produto entre as fornecidas, ou a mais adequada"),
      quantity: z.number().describe("Quantidade comprada; use 1 se não houver"),
      price: z.number().describe("Preço unitário em reais; use 0 se não houver"),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { pdf, categories } = (await req.json()) as {
      pdf?: string
      categories?: string[]
    }

    if (!pdf) {
      return Response.json({ error: "Arquivo PDF ausente." }, { status: 400 })
    }

    // pdf is a data URL: "data:application/pdf;base64,...."
    const base64 = pdf.includes(",") ? pdf.split(",")[1] : pdf
    const bytes = Buffer.from(base64, "base64")

    const categoryList = categories?.length ? categories.join(", ") : "Hortifruti, Carnes, Bebidas, Limpeza, Outros"

    const { experimental_output } = await generateText({
      model: "google/gemini-3.5-flash",
      experimental_output: Output.object({ schema: itemsSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Este PDF contém uma lista de compras ou cupom/nota fiscal de supermercado. " +
                "Extraia TODOS os produtos com nome, quantidade e preço unitário (em reais). " +
                "Se o documento trouxer apenas o valor total de um item, divida pelo número de unidades para obter o unitário. " +
                "Classifique cada produto em uma destas categorias quando possível: " +
                categoryList +
                ". Se nenhuma servir, use \"Outros\". Não invente itens que não estejam no documento.",
            },
            {
              type: "file",
              data: bytes,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    })

    const items = (experimental_output?.items ?? []).map((i) => ({
      name: String(i.name || "").trim(),
      category: String(i.category || "Outros").trim() || "Outros",
      quantity: Number.isFinite(i.quantity) && i.quantity > 0 ? i.quantity : 1,
      price: Number.isFinite(i.price) && i.price >= 0 ? i.price : 0,
    }))

    return Response.json({ items: items.filter((i) => i.name) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("[v0] parse-pdf error:", message)

    // Surface a clear, actionable message when the AI Gateway is not billable yet.
    const isBilling = /credit card|billing|payment|quota|insufficient|unlock your free credits/i.test(message)
    const friendly = isBilling
      ? "A leitura por IA precisa que o AI Gateway esteja ativo (com um cartão cadastrado no projeto Vercel). Enquanto isso, adicione os itens manualmente."
      : "Não foi possível ler o PDF. Tente outro arquivo ou insira os itens manualmente."

    return Response.json({ error: friendly }, { status: 500 })
  }
}
