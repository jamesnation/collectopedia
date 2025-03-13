/**
 * components/item-details/common/footer.tsx
 * 
 * A simple footer component for the item details page.
 */

interface FooterProps {
  text?: string;
}

export function Footer({ text = "© 2024 Collectopedia. All rights reserved." }: FooterProps) {
  return (
    <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
      <div className="text-center text-sm text-muted-foreground">
        {text}
      </div>
    </footer>
  );
} 