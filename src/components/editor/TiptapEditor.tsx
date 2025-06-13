
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Quote, Code, Minus, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type {useEffect} from 'react'; 
import { useEffect as useReactEffect, useCallback } from 'react';


interface TiptapEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  className?: string;
}

const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
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
  }, [editor]);


  return (
    <div className="border border-input bg-transparent rounded-t-md p-2 flex flex-wrap items-center gap-1">
      <ToggleGroup type="multiple" size="sm">
        <ToggleGroupItem
          value="bold"
          aria-label="Toggle bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          aria-label="Toggle italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="strike"
          aria-label="Toggle strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          data-active={editor.isActive('strike')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <Separator orientation="vertical" className="h-6 mx-1" />
       <ToggleGroup type="single" size="sm">
        <ToggleGroupItem
          value="heading"
          aria-label="Toggle heading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive('heading', { level: 2 })}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <Heading2 className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <ToggleGroup type="single" size="sm">
        <ToggleGroupItem
            value="link"
            aria-label="Toggle link"
            onClick={setLink}
            data-active={editor.isActive('link')}
            className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
          >
            <LinkIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
       <Separator orientation="vertical" className="h-6 mx-1" />
      <ToggleGroup type="multiple" size="sm">
        <ToggleGroupItem
          value="bulletList"
          aria-label="Toggle bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="orderedList"
          aria-label="Toggle ordered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <ListOrdered className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <ToggleGroup type="multiple" size="sm">
        <ToggleGroupItem
          value="blockquote"
          aria-label="Toggle blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive('blockquote')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <Quote className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="codeBlock"
          aria-label="Toggle code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          data-active={editor.isActive('codeBlock')}
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        >
          <Code className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
       <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function TiptapEditor({ content, onChange, className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
            HTMLAttributes: {
                class: 'list-disc pl-6',
            },
        },
        orderedList: {
            HTMLAttributes: {
                class: 'list-decimal pl-6',
            },
        },
        blockquote: {
            HTMLAttributes: {
                class: 'border-l-4 border-muted-foreground pl-4 italic',
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class: 'bg-muted text-muted-foreground p-2 rounded-md font-code text-sm',
            },
        },
      }),
      LinkExtension.configure({
        openOnClick: false, // Recommended to prevent accidental navigation during editing
        autolink: true,
        HTMLAttributes: {
          // You can add attributes like rel, target here
          // Example: target: '_blank', rel: 'noopener noreferrer nofollow',
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
    ],
    content: content, 
    editorProps: {
      attributes: {
        class: cn(
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl',
          'min-h-[150px] w-full rounded-b-md border border-input border-t-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
           className
        ),
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useReactEffect(() => {
    if (editor && editor.isEditable && editor.getHTML() !== content) {
      const timer = setTimeout(() => {
         editor.commands.setContent(content, false); 
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [content, editor]);


  return (
    <div className="flex flex-col">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
