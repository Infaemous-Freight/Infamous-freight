/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Context Provider for Help & Support System
 *
 * Manages help modals, contextual assistance, and FAQ
 */

import React, { createContext, useContext, ReactNode, useState, useCallback } from "react";

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  relatedTopics?: string[];
}

export interface HelpContextType {
  showHelp: (articleId: string) => void;
  hideHelp: () => void;
  helpArticleOpen: string | null;
  searchHelp: (query: string) => HelpArticle[];
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

// Built-in help articles for freight platform
const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `Welcome to Infæmous Freight! 
    
1. Create your account and verify your email
2. Set up your organization profile
3. Add your fleet information
4. Start tracking shipments
5. Monitor real-time analytics

For more help, hover over the ? icon anywhere in the app.`,
    category: "Getting Started",
    relatedTopics: ["dashboard", "profiles"],
  },
  {
    id: "shipments",
    title: "Managing Shipments",
    content: `Track and manage your shipments:
    
1. Click "New Shipment" to create a shipment
2. Enter origin, destination, and cargo details
3. Assign drivers and vehicles
4. Monitor progress in real-time
5. Get notifications at each milestone

Use filters to find specific shipments quickly.`,
    category: "Shipments",
    relatedTopics: ["tracking", "drivers"],
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    content: `Your dashboard displays:
    
• Active shipments count
• Fleet status
• Recent transactions
• Performance metrics
• Alerts and notifications

Customize your dashboard by clicking the settings icon.`,
    category: "Dashboard",
    relatedTopics: ["metrics", "alerts"],
  },
  {
    id: "billing",
    title: "Billing & Payments",
    content: `Manage your account billing:
    
1. Go to Settings > Billing
2. View invoices and payment history
3. Update payment method
4. See current plan and usage
5. Download receipts anytime

Billing is processed on the 1st of each month.`,
    category: "Billing",
    relatedTopics: ["pricing", "invoices"],
  },
  {
    id: "tracking",
    title: "Real-Time Tracking",
    content: `Track shipments in real-time:
    
1. Click on any shipment to see details
2. View live GPS location on map
3. See estimated arrival time
4. Get notifications at key waypoints
5. View delivery proof and signed receipt

Tracking updates every 30 seconds.`,
    category: "Tracking",
    relatedTopics: ["shipments", "notifications"],
  },
  {
    id: "drivers",
    title: "Driver Management",
    content: `Manage your drivers:
    
1. Go to Fleet > Drivers
2. Add new drivers with their information
3. Assign vehicles and routes
4. View driver history and performance
5. Track driver compliance

Each driver needs a valid driver's license and insurance.`,
    category: "Fleet",
    relatedTopics: ["fleets", "vehicles"],
  },
];

export const HelpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [helpArticleOpen, setHelpArticleOpen] = useState<string | null>(null);

  const showHelp = useCallback((articleId: string) => {
    setHelpArticleOpen(articleId);
  }, []);

  const hideHelp = useCallback(() => {
    setHelpArticleOpen(null);
  }, []);

  const searchHelp = useCallback((query: string): HelpArticle[] => {
    return HELP_ARTICLES.filter(
      (article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase()) ||
        article.category.toLowerCase().includes(query.toLowerCase()),
    );
  }, []);

  return (
    <HelpContext.Provider
      value={{
        showHelp,
        hideHelp,
        helpArticleOpen,
        searchHelp,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error("useHelp must be used within HelpProvider");
  }
  return context;
};

export default HelpProvider;
