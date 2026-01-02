import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Phone, Mail } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

export default function ContactSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { contactEmail, contactPhone } = useBranding();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    serviceType: '',
    message: ''
  });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/contact', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('contact.toast.successTitle'),
        description: t('contact.toast.successDescription'),
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        serviceType: '',
        message: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('contact.toast.errorDescription'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      toast({
        title: t('contact.toast.missingTitle'),
        description: t('contact.toast.missingDescription'),
        variant: "destructive",
      });
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="contact-title">
            {t('contact.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="contact-description">
            {t('contact.description')}
          </p>
        </div>

        <div className="space-y-12">
          {/* Contact Information - On Top */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-8 text-center" data-testid="contact-info-title">
              {t('contact.info.title')}
            </h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="flex items-start space-x-4" data-testid="contact-phone">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('contact.info.phone')}</h4>
                  {contactPhone ? (
                    <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="text-muted-foreground hover:text-primary">{contactPhone}</a>
                  ) : (
                    <p className="text-muted-foreground">{t('contact.info.contactForDetails')}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('contact.info.phoneAvailability')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4" data-testid="contact-email">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('contact.info.email')}</h4>
                  {contactEmail ? (
                    <a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-primary">{contactEmail}</a>
                  ) : (
                    <p className="text-muted-foreground">{t('contact.info.contactForDetails')}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('contact.info.emailResponse')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form - Below */}
          <div className="bg-card rounded-xl p-8 shadow-lg border border-border max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-card-foreground mb-6" data-testid="contact-form-title">
              {t('contact.form.title')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('contact.form.firstName')} *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder={t('contact.form.firstNamePlaceholder')}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('contact.form.lastName')} *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder={t('contact.form.lastNamePlaceholder')}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">{t('contact.form.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('contact.form.emailPlaceholder')}
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="phone">{t('contact.form.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('contact.form.phonePlaceholder')}
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="serviceType">{t('contact.form.serviceType')}</Label>
                <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue placeholder={t('contact.form.selectService')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport">{t('contact.form.services.airport')}</SelectItem>
                    <SelectItem value="corporate">{t('contact.form.services.corporate')}</SelectItem>
                    <SelectItem value="events">{t('contact.form.services.events')}</SelectItem>
                    <SelectItem value="hourly">{t('contact.form.services.hourly')}</SelectItem>
                    <SelectItem value="other">{t('contact.form.services.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">{t('contact.form.message')} *</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder={t('contact.form.messagePlaceholder')}
                  data-testid="input-message"
                />
              </div>

              <Button
                type="submit"
                disabled={contactMutation.isPending}
                className="w-full"
                data-testid="button-submit-contact"
              >
                {contactMutation.isPending ? t('contact.form.sending') : t('contact.form.sendMessage')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
