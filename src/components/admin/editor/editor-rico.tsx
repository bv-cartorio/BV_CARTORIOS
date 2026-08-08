"use client";

import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState, useTransition } from "react";

import { enviarImagemDoEditor } from "@/app/admin/upload";
import { Dialogo } from "@/components/ui/dialogo";

type EditorRicoProps = {
  /** Nome do campo enviado no formulário. */
  name: string;
  rotulo: string;
  conteudoInicial?: string;
  ajuda?: string;
  /** Envio de imagem disponível (depende das variáveis R2_*). */
  imagensLigadas?: boolean;
};

const BOTAO =
  "rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-30";
const INATIVO = "text-marinho-600 hover:bg-creme hover:text-marinho-900";
const ATIVO = "bg-marinho-700 text-white";

function Grupo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 border-r border-creme-200 pr-1.5 last:border-r-0">
      {children}
    </div>
  );
}

/**
 * Editor de texto rico do admin.
 *
 * O HTML que sai daqui ainda passa por `sanitizarHtml` no servidor. O editor
 * limita o que se consegue escrever; o sanitizador é quem garante — colar de um
 * PDF de prova ou do Word traz marcação que nenhum editor promete filtrar.
 *
 * O conteúdo viaja num `<input type="hidden">`: assim o formulário inteiro é uma
 * server action comum, sem estado de cliente atravessando a página.
 */
export function EditorRico({
  name,
  rotulo,
  conteudoInicial = "",
  ajuda,
  imagensLigadas = false,
}: EditorRicoProps) {
  const [html, setHtml] = useState(conteudoInicial);
  const [linkAberto, setLinkAberto] = useState(false);
  const [erroImagem, setErroImagem] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const seletorArquivo = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // A allowlist não tem <pre> nem <code>: questão de concurso de cartório
        // não traz bloco de código, e deixar ligado só rende colagem estranha.
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Image.configure({ inline: false }),
      TableKit.configure({ table: { resizable: false } }),
      Subscript,
      Superscript,
    ],
    content: conteudoInicial,
    // Obrigatório no App Router: renderizar de imediato no servidor quebra a
    // hidratação do ProseMirror.
    immediatelyRender: false,
    onUpdate: ({ editor: atual }) => setHtml(atual.getHTML()),
    editorProps: {
      attributes: {
        class:
          "conteudo-rico min-h-48 px-4 py-3 text-marinho-800 outline-none",
      },
    },
  });

  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            negrito: e.isActive("bold"),
            italico: e.isActive("italic"),
            sublinhado: e.isActive("underline"),
            riscado: e.isActive("strike"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            marcadores: e.isActive("bulletList"),
            numerada: e.isActive("orderedList"),
            citacao: e.isActive("blockquote"),
            sobrescrito: e.isActive("superscript"),
            subscrito: e.isActive("subscript"),
            link: e.isActive("link"),
            naTabela: e.isActive("table"),
            podeDesfazer: e.can().undo(),
            podeRefazer: e.can().redo(),
          }
        : null,
  });

  if (!editor) {
    return (
      <div>
        <span className="block text-sm font-medium text-marinho-800">
          {rotulo}
        </span>
        <div className="mt-1.5 h-48 animate-pulse rounded-lg border border-creme-200 bg-creme" />
      </div>
    );
  }

  function aplicarLink(dados: FormData) {
    const url = String(dados.get("url") ?? "").trim();
    setLinkAberto(false);

    if (!url) {
      editor?.chain().focus().unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  function escolherImagem(arquivo: File) {
    setErroImagem(null);

    iniciarEnvio(async () => {
      const dados = new FormData();
      dados.set("arquivo", arquivo);

      const resultado = await enviarImagemDoEditor(dados);

      if (!resultado.ok) {
        setErroImagem(resultado.erro);
        return;
      }

      editor?.chain().focus().setImage({ src: resultado.url }).run();
    });
  }

  return (
    <div>
      <span className="block text-sm font-medium text-marinho-800">
        {rotulo}
      </span>

      <div className="mt-1.5 overflow-hidden rounded-lg border border-creme-200 bg-white focus-within:border-marinho-400 focus-within:ring-2 focus-within:ring-marinho-100">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-creme-200 bg-creme/50 px-2 py-1.5">
          <Grupo>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${BOTAO} ${estado?.negrito ? ATIVO : INATIVO} font-bold`}
              title="Negrito"
            >
              N
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${BOTAO} ${estado?.italico ? ATIVO : INATIVO} italic`}
              title="Itálico"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`${BOTAO} ${estado?.sublinhado ? ATIVO : INATIVO} underline`}
              title="Sublinhado"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`${BOTAO} ${estado?.riscado ? ATIVO : INATIVO} line-through`}
              title="Riscado"
            >
              R
            </button>
          </Grupo>

          <Grupo>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`${BOTAO} ${estado?.h2 ? ATIVO : INATIVO}`}
              title="Título"
            >
              T1
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`${BOTAO} ${estado?.h3 ? ATIVO : INATIVO}`}
              title="Subtítulo"
            >
              T2
            </button>
          </Grupo>

          <Grupo>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`${BOTAO} ${estado?.marcadores ? ATIVO : INATIVO}`}
              title="Lista com marcadores"
            >
              •—
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`${BOTAO} ${estado?.numerada ? ATIVO : INATIVO}`}
              title="Lista numerada"
            >
              1—
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`${BOTAO} ${estado?.citacao ? ATIVO : INATIVO}`}
              title="Citação"
            >
              ❝
            </button>
          </Grupo>

          <Grupo>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              className={`${BOTAO} ${estado?.sobrescrito ? ATIVO : INATIVO}`}
              title="Sobrescrito (ex.: 1º)"
            >
              x²
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              className={`${BOTAO} ${estado?.subscrito ? ATIVO : INATIVO}`}
              title="Subscrito"
            >
              x₂
            </button>
          </Grupo>

          <Grupo>
            <button
              type="button"
              onClick={() => setLinkAberto(true)}
              className={`${BOTAO} ${estado?.link ? ATIVO : INATIVO}`}
              title="Link"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              className={`${BOTAO} ${INATIVO}`}
              title="Inserir tabela 3×3"
            >
              ▦
            </button>

            {estado?.naTabela && (
              <>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className={`${BOTAO} ${INATIVO}`}
                  title="Adicionar linha"
                >
                  +linha
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className={`${BOTAO} ${INATIVO}`}
                  title="Adicionar coluna"
                >
                  +col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className={`${BOTAO} ${INATIVO}`}
                  title="Remover tabela"
                >
                  ✕▦
                </button>
              </>
            )}
          </Grupo>

          {imagensLigadas && (
            <Grupo>
              <button
                type="button"
                disabled={enviando}
                onClick={() => seletorArquivo.current?.click()}
                className={`${BOTAO} ${INATIVO}`}
                title="Enviar imagem"
              >
                {enviando ? "enviando..." : "🖼"}
              </button>

              <input
                ref={seletorArquivo}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(evento) => {
                  const arquivo = evento.target.files?.[0];
                  // Limpa o valor para o mesmo arquivo poder ser escolhido de novo.
                  evento.target.value = "";
                  if (arquivo) escolherImagem(arquivo);
                }}
              />
            </Grupo>
          )}

          <Grupo>
            <button
              type="button"
              disabled={!estado?.podeDesfazer}
              onClick={() => editor.chain().focus().undo().run()}
              className={`${BOTAO} ${INATIVO}`}
              title="Desfazer"
            >
              ↶
            </button>
            <button
              type="button"
              disabled={!estado?.podeRefazer}
              onClick={() => editor.chain().focus().redo().run()}
              className={`${BOTAO} ${INATIVO}`}
              title="Refazer"
            >
              ↷
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              className={`${BOTAO} ${INATIVO}`}
              title="Limpar formatação"
            >
              Tx
            </button>
          </Grupo>
        </div>

        <EditorContent editor={editor} />
      </div>

      <input type="hidden" name={name} value={html} />

      {erroImagem && (
        <p role="alert" className="mt-1.5 text-xs text-laranja-600">
          {erroImagem}
        </p>
      )}

      {ajuda && !erroImagem && (
        <p className="mt-1.5 text-xs text-marinho-500">{ajuda}</p>
      )}

      <Dialogo
        aberto={linkAberto}
        titulo="Link"
        aoFechar={() => setLinkAberto(false)}
      >
        <form action={aplicarLink} className="space-y-3">
          <label
            htmlFor={`link-${name}`}
            className="block text-xs font-medium text-marinho-600"
          >
            Endereço (deixe em branco para remover o link)
          </label>
          <input
            id={`link-${name}`}
            name="url"
            type="url"
            placeholder="https://www.planalto.gov.br/..."
            className="block w-full rounded-lg border border-creme-200 px-3 py-2 text-sm text-marinho-900 outline-none focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-marinho-700 px-4 py-2 text-sm font-semibold text-white hover:bg-marinho-800"
          >
            Aplicar
          </button>
        </form>
      </Dialogo>
    </div>
  );
}
