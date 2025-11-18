import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
} from 'lucide-react';

interface FrontendPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

export function FrontendPageEditor({ content, onChange }: FrontendPageEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setColor = () => {
    const color = window.prompt('Enter color (e.g., #ff0000 or red)');
    if (color) {
      editor.chain().focus().setColor(color).run();
    }
  };

  const setBackgroundColor = () => {
    const color = window.prompt('Enter background color (e.g., #ffff00 or yellow)');
    if (color) {
      editor.chain().focus().setMark('textStyle', { backgroundColor: color }).run();
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 p-3 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-bold"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive('strike') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-9 bg-slate-300 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-h1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-h2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-h3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 4 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-h4"
        >
          <Heading4 className="h-4 w-4" />
        </Button>

        <div className="w-px h-9 bg-slate-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-bullet-list"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-9 w-9 p-0"
          data-testid="toolbar-ordered-list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-9 bg-slate-300 mx-1" />

        {/* Link & Image */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('link') ? 'default' : 'outline'}
          onClick={setLink}
          className="h-9 w-9 p-0"
          data-testid="toolbar-link"
        >
          <Link2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addImage}
          className="h-9 w-9 p-0"
          data-testid="toolbar-image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-9 bg-slate-300 mx-1" />

        {/* Colors */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={setColor}
          className="h-9 px-3"
          data-testid="toolbar-text-color"
        >
          <span className="text-xs font-medium">Text Color</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={setBackgroundColor}
          className="h-9 px-3"
          data-testid="toolbar-bg-color"
        >
          <span className="text-xs font-medium">BG Color</span>
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
