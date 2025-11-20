import { db } from './db';
import { emailTemplates } from '@shared/schema';
import { getAllDefaultEmailTemplates } from './emailTemplateDefaults';

/**
 * Ensures all default email templates are seeded into the database.
 * This function is idempotent and safe to call on every server boot.
 * It will insert missing templates and update existing ones.
 */
export async function ensureEmailTemplatesSeeded(): Promise<void> {
  try {
    console.log('🌱 [SEED] Checking email templates...');
    
    const defaultTemplates = await getAllDefaultEmailTemplates();
    
    for (const template of defaultTemplates) {
      await db.insert(emailTemplates).values({
        slug: template.slug,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        category: template.category,
        description: template.description,
        isActive: true,
      }).onConflictDoUpdate({
        target: emailTemplates.slug,
        set: {
          name: template.name,
          subject: template.subject,
          body: template.body,
          variables: template.variables,
          category: template.category,
          description: template.description,
          updatedAt: new Date(),
        },
      });
      
      console.log(`  ✓ Template ready: ${template.slug}`);
    }
    
    console.log('✅ [SEED] All email templates ready!');
  } catch (error) {
    console.error('❌ [SEED] Error seeding email templates:', error);
    throw error; // Re-throw to prevent server start with missing templates
  }
}

// Allow running this file directly for manual seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureEmailTemplatesSeeded()
    .then(() => {
      console.log('Manual seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Manual seed failed:', error);
      process.exit(1);
    });
}
