import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const STEPS = ['Personal Info', 'Academic', 'Contact & Bio', 'Preferences'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 4 + i);

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    college_id: '',
    date_of_birth: '',
    gender: '',
    academic_year: '',
    graduation_year: '',
    start_year: '',
    department: '',
    minor: '',
    phone_number: '',
    bio: '',
    interests: [] as string[],
    relationship_status: '',
    looking_for: '',
    hometown: '',
    languages: [] as string[],
  });

  const [interestInput, setInterestInput] = useState('');
  const [langInput, setLangInput] = useState('');

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const addTag = (key: 'interests' | 'languages', input: string, setInput: (v: string) => void) => {
    const trimmed = input.trim();
    if (trimmed && !form[key].includes(trimmed)) {
      setForm((p) => ({ ...p, [key]: [...p[key], trimmed] }));
    }
    setInput('');
  };

  const removeTag = (key: 'interests' | 'languages', val: string) => {
    setForm((p) => ({ ...p, [key]: p[key].filter((v) => v !== val) }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 0:
        return !!(form.full_name && form.college_id && form.date_of_birth && form.gender);
      case 1:
        return !!(form.academic_year && form.graduation_year && form.start_year && form.department);
      case 2:
        return !!(form.phone_number && form.bio && form.interests.length > 0);
      case 3:
        return !!(form.relationship_status && form.looking_for && form.hometown && form.languages.length > 0);
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        user_id: user.id,
        full_name: form.full_name,
        college_id: form.college_id,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        academic_year: form.academic_year,
        graduation_year: parseInt(form.graduation_year),
        start_year: parseInt(form.start_year),
        department: form.department,
        minor: form.minor || null,
        phone_number: form.phone_number,
        bio: form.bio,
        interests: form.interests,
        relationship_status: form.relationship_status,
        looking_for: form.looking_for,
        hometown: form.hometown,
        languages: form.languages,
      });
      if (profileError) throw profileError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: 'Welcome!', description: 'Your profile is set up.' });
      navigate('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
            <CardDescription>Fill in all required fields to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>College/University ID *</Label>
                  <Input value={form.college_id} onChange={(e) => set('college_id', e.target.value)} placeholder="STU-12345" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select value={form.academic_year} onValueChange={(v) => set('academic_year', v)}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'].map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Year *</Label>
                  <Select value={form.start_year} onValueChange={(v) => set('start_year', v)}>
                    <SelectTrigger><SelectValue placeholder="Select start year" /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year *</Label>
                  <Select value={form.graduation_year} onValueChange={(v) => set('graduation_year', v)}>
                    <SelectTrigger><SelectValue placeholder="Select grad year" /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department/Major *</Label>
                  <Input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label>Minor</Label>
                  <Input value={form.minor} onChange={(e) => set('minor', e.target.value)} placeholder="Optional" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Bio/About Me * ({form.bio.length}/500)</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => { if (e.target.value.length <= 500) set('bio', e.target.value); }}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interests/Hobbies * (press Enter to add)</Label>
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('interests', interestInput, setInterestInput); } }}
                    placeholder="e.g. Photography"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.interests.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button type="button" onClick={() => removeTag('interests', t)}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Relationship Status *</Label>
                  <Select value={form.relationship_status} onValueChange={(v) => set('relationship_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="In a relationship">In a relationship</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Looking For *</Label>
                  <Select value={form.looking_for} onValueChange={(v) => set('looking_for', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Friends">Friends</SelectItem>
                      <SelectItem value="Dating">Dating</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hometown/City *</Label>
                  <Input value={form.hometown} onChange={(e) => set('hometown', e.target.value)} placeholder="San Francisco, CA" />
                </div>
                <div className="space-y-2">
                  <Label>Languages Spoken * (press Enter to add)</Label>
                  <Input
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('languages', langInput, setLangInput); } }}
                    placeholder="e.g. English"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.languages.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button type="button" onClick={() => removeTag('languages', t)}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!validateStep()}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!validateStep() || loading}>
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
