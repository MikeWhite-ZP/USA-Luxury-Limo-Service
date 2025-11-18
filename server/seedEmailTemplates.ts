import { db } from './db';
import { emailTemplates } from '@shared/schema';
import { getAllDefaultEmailTemplates } from './emailTemplateDefaults';

async function seedEmailTemplates() {
  try {
    console.log('Seeding email templates...');
    
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
      
      console.log(`✓ Seeded template: ${template.slug}`);
    }
    
    console.log('✅ All email templates seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding email templates:', error);
    process.exit(1);
  }
}

seedEmailTemplates();
