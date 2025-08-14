"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/utils/supabaseClient";
import { User } from "@supabase/supabase-js";

export default function About() {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  const handleDeleteData = async () => {
    if (!user) {
      alert('You must be logged in to delete your data.');
      return;
    }
  
    if (!window.confirm("Are you sure you want to permanently delete all your data (local + remote)? This cannot be undone.")) {
      return;
    }
  
    const errors = [];

    
    const { error: chatHistoryError } = await supabase.from('chat_messages').delete().eq('user_id', user.id);
    if (chatHistoryError) errors.push('chat history');

    const { error: chatSessionsError } = await supabase.from('chat_sessions').delete().eq('user_id', user.id);
    if (chatSessionsError) errors.push('chat sessions');
  
    const { error: eventsError } = await supabase.from('events').delete().eq('user_id', user.id);
    if (eventsError) errors.push('events');

    const { error: userError } = await supabase.from('profiles').delete().eq('id', user.id);
    if (userError) errors.push('user');
  
    if (errors.length > 0) {
      alert(`Failed to delete the following data: ${errors.join(', ')}. Please try again later.`);
      console.error('Deletion errors:', errors);
      return;
    }
  
    await supabase.auth.signOut();
    localStorage.clear();
  
    alert("All your data has been deleted (local and remote). You have been signed out.");
  };
  
  
  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* User Manual Section */}
      <div
        id="user-manual"
        className="bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-black/5 transition-all duration-300"
      >
        <button
          onClick={() => setIsManualOpen((prev) => !prev)}
          className="w-full flex justify-between items-center px-6 py-4 bg-[#1e293b] text-white rounded-t-2xl hover:bg-[#2e384a] transition-all duration-300"
        >
          <span className="font-semibold text-lg">User Manual</span>
          <span className="text-xl">{isManualOpen ? "-" : "+"}</span>
        </button>
        {isManualOpen && (
          <div className="p-6 space-y-4 text-text">
            <p className="text-lg">
              Welcome to the WorkFlow MVP! Here's how to make the most of its
              features:
            </p>
            <ol className="list-decimal pl-5 space-y-3 text-text/80">
              <li>
                <strong className="text-primary">Adding Events:</strong> There
                are 3 options to add events:
                <ul className="list-disc pl-5 space-y-2 text-text/80">
                  <li>
                    Click the "add event" button in the top right corner of the
                    calendar or click anywhere on the calendar to manually add
                    an event.
                  </li>
                  <li>
                    Use the text input button in the top right corner of the
                    calendar to quickly add a one-off event.
                  </li>
                  <li>
                    Use the plan page chat-bot (in edit-schedule mode) to add
                    multiple or more complex events at once.
                  </li>
                  <li>
                    HINT: Use the Windows + H shortcut for speech-to-text to
                    seamlessly add events.
                  </li>
                </ul>
              </li>
              <li>
                <strong className="text-primary">AI Assistance:</strong> The AI
                can assist with adding events and scheduling. In the future, it
                will also help with studying, sending emails, and syncing with
                external calendars. It improves over time with the feedback you
                give in chats and from event outcomes on the Productivity page.
              </li>
              <li>
                <strong className="text-primary">Productivity Page:</strong>{" "}
                Currently, this tracks productivity and gives insights based on
                completed events. Future updates will add timers, focus modes,
                and study-with-GPT tools.
              </li>
              <li>
                <strong className="text-primary">Future Enhancements:</strong>
                <ul className="list-disc pl-5 space-y-2 text-text/80">
                  <li>Dedicated study mode on the productivity page</li>
                  <li>
                    More personalization for the AI, calendar appearance, and
                    productivity tools
                  </li>
                  <li>
                    Premium version with unlimited, highly personalized AI
                    assistant
                  </li>
                </ul>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Privacy Statement Section */}
      <div
        id="privacy-statement"
        className="bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-black/5 transition-all duration-300"
      >
        <button
          onClick={() => setIsPrivacyOpen((prev) => !prev)}
          className="w-full flex justify-between items-center px-6 py-4 bg-[#1e293b] text-white rounded-t-2xl hover:bg-[#2e384a] transition-all duration-300"
        >
          <span className="font-semibold text-lg">Privacy Statement</span>
          <span className="text-xl">{isPrivacyOpen ? "-" : "+"}</span>
        </button>
        {isPrivacyOpen && (
          <div className="p-6 space-y-4 text-text">
            <p>
              <strong>Effective Date:</strong>{" "}
              {new Date().toLocaleDateString()}
            </p>
            <p>
              This Privacy Statement explains how WorkFlow (“we”, “our”, or
              “us”) collects, uses, stores, and protects your personal data when
              you use our services. By using WorkFlow, you agree to the terms of
              this statement.
            </p>

            <h3 className="text-lg font-semibold">1. Data We Collect</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> When you sign in with
                Google, we receive your name, email address, and profile image.
              </li>
              <li>
                <strong>Event Data:</strong> Titles, dates, times, descriptions,
                and metadata for events you create in your calendar.
              </li>
              <li>
                <strong>AI Chat History:</strong> Conversations with the AI
                assistant used for scheduling, planning, or productivity
                guidance.
              </li>
              <li>
                <strong>Preferences & Settings:</strong> Your theme, view
                settings, and personalization options.
              </li>
              <li>
                <strong>Usage Data:</strong> Non-identifiable analytics such as
                feature usage patterns and session timestamps.
              </li>
            </ul>

            <h3 className="text-lg font-semibold">2. How We Use Your Data</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                To operate and maintain your account and calendar events.
              </li>
              <li>
                To provide AI-powered suggestions, insights, and productivity
                features.
              </li>
              <li>
                To improve the performance, reliability, and personalization of
                WorkFlow.
              </li>
              <li>
                To prevent abuse, fraud, and unauthorized access to our systems.
              </li>
            </ul>

            <h3 className="text-lg font-semibold">3. Data Storage</h3>
            <p>
              Your data is securely stored in{" "}
              <strong>Supabase</strong>, a cloud-hosted PostgreSQL database.
              Access is restricted and protected using authentication and role-based permissions.
              Some temporary data may be stored in your browser’s localStorage
              for faster loading.
            </p>

            <h3 className="text-lg font-semibold">4. Data Sharing</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                We do not sell or rent your data to third parties.
              </li>
              <li>
                Your AI chat content is securely sent to the OpenAI API for
                processing. OpenAI may temporarily retain data for abuse
                monitoring per their policy.
              </li>
              <li>
                Authentication is handled securely via Google OAuth. We do not
                store your Google password.
              </li>
            </ul>

            <h3 className="text-lg font-semibold">5. Your Rights</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Request an export of all your stored data.</li>
              <li>Request deletion of all your data (local and remote).</li>
              <li>Withdraw consent and close your account.</li>
            </ul>

            <h3 className="text-lg font-semibold">6. Security</h3>
            <p>
              We use industry-standard encryption and security practices to
              protect your data. However, no method of transmission or storage
              is 100% secure.
            </p>

            <h3 className="text-lg font-semibold">7. Delete My Data</h3>
            <p>
              Use the button below to delete all data stored locally in your
              browser. To request deletion of all remote data stored in Supabase,
              contact us at siddiali29@gmail.com.
            </p>
            <button
              onClick={handleDeleteData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Delete My Local Data
            </button>

            <h3 className="text-lg font-semibold">8. Contact</h3>
            <p>
              For questions about privacy or data handling, email:
              siddiali29@gmail.com
            </p>
          </div>
        )}
      </div>

        {/* About the Developer Section */}
        <div
        id="about-the-developer"
        className="bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-black/5 transition-all duration-300"
        >
        <button
            onClick={() => setIsDeveloperOpen((prev) => !prev)}
            className="w-full flex justify-between items-center px-6 py-4 bg-[#1e293b] text-white rounded-t-2xl hover:bg-[#2e384a] transition-all duration-300"
        >
            <span className="font-semibold text-lg">About the Developer</span>
            <span className="text-xl">{isDeveloperOpen ? "-" : "+"}</span>
        </button>

        {isDeveloperOpen && (
            <div className="p-6 space-y-6 text-text">
            {/* Profile Image */}
            <div className="flex justify-center">
                <img
                src="https://media.licdn.com/dms/image/v2/D5603AQH_Gh2TL-f2pA/profile-displayphoto-shrink_800_800/B56ZfP.I2mG0Ac-/0/1751540862952?e=1757548800&v=beta&t=08u8C3GF_210385jx6s_Fd5h0cPZCqhxFxA7mzoVrBU"
                alt="Ali Siddiqui"
                className="w-40 h-40 rounded-full shadow-md border border-black/10"
                />
            </div>

            {/* Bio */}
            <div className="space-y-4">
                <p>
                Hi! I'm <strong>Ali Siddiqui</strong>, a sophomore at the University of Pittsburgh
                pursuing an <strong>Honors degree in Electrical Engineering</strong>.
                I'm deeply passionate about entrepreneurship, startups,
                and learning new skills on my own — especially in the realms of coding, product design, and AI.
                </p>
                <p>
                I built this MVP as part of my own startup project, <strong>WorkFlow</strong>, whose mission is
                to empower people to organize their lives, stay productive, and make smarter use of their time
                with the help of AI-powered scheduling and productivity tools. This is the first iteration of the app, and I'm working on adding more features and improving the app with each update.
                This app has features tailored towards students with ADHD, but I'm working on adding more features to help them manage their time and stay productive.
                You can view our business plan here: <a href="/WorkFlow_AI_Business_Plan.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary underline font-medium">WorkFlow Business Plan</a>
                </p>
                <p>
                Outside of classes, I've partnered with the director of Pitt's Big Idea Center (office of student entrepreneurship) to <strong>launch their first ever startup accelerator club</strong> and have a growing interest in
                venture capital - I recently applied to be a <strong>Pear Fellow</strong> to further explore that space.
                I'm always looking to connect with innovative thinkers, and I'm searching for <strong>internships for the
                summer of 2026</strong>.
                </p>
            </div>

            {/* Links */}
            <div className="flex gap-4 justify-center">
                <a
                href="https://www.linkedin.com/in/ali-siddiqui-601ab0325?"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl bg-[#1e293b] text-white font-medium hover:bg-[#2e384a] transition-all duration-200 shadow-md"
                >
                LinkedIn
                </a>
                <a
                href="" // Replace with your portfolio link
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl bg-[#1e293b] text-white font-medium hover:bg-[#2e384a] transition-all duration-200 shadow-md"
                >
                Portfolio
                </a>
            </div>
            </div>
        )}
        </div>
    </div>
  );
}
