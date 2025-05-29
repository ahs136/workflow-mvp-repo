'use client';

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover border border-black/5 hover:-translate-y-1 transition-all duration-300">
      <h3 className="text-[22px] font-bold text-text mb-4">{title}</h3>
      <p className="text-text/70 leading-relaxed">{description}</p>
    </div>
  );
}

export default function Features() {
  const features = [
    {
      title: "Schedule Management",
      description: "Efficiently manage your daily, weekly, and monthly schedules"
    },
    {
      title: "Task Management",
      description: "Organize and prioritize your tasks effectively"
    },
    {
      title: "Event Planning",
      description: "Create and organize events with ease"
    },
    {
      title: "Progress Tracking",
      description: "Monitor your productivity and achievements"
    },
    {
      title: "Goal Setting",
      description: "Set and achieve your personal and professional goals"
    },
    {
      title: "Smart Reminders",
      description: "Never miss an important deadline or meeting"
    }
  ];

  return (
    <section className="py-24 px-6 bg-bg-light">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 