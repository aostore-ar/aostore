'use client'

import { Message } from "@/types/message";
import { MessageCard } from "./MessageCard";
import { AnimatedListItem } from "../../animations/AnimatedListItem";
import { Suspense, useEffect, useState } from "react";
import { aoMessageService, MessageFilterParams } from "@/services/ao/messageService";
import InfinityScrollControls from "../../InfinityScrollControls";
import { DEFAULT_PAGE_SIZE } from "@/config/page";
import toast from "react-hot-toast";
import { EmptyState } from "../../EmptyState";
import { MessageCircle } from "lucide-react";
import SentMessageListSkeleton from "./skeletons/SentMessageListSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

export function MessagesList() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const { isConnected, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        const loadMessages = async () => {
            const filterParams = Object.fromEntries(searchParams.entries()) as MessageFilterParams;

            try {
                setIsLoading(true);

                if (!isAuthLoading && isConnected) {
                    const { messages, total } = await aoMessageService.getSentMessages(filterParams, true);

                    if (messages) {
                        setMessages(messages);
                        setTotalItems(total);
                    }
                } else {
                    setMessages([]);
                    setTotalItems(0);
                }

            } catch (error) {
                toast.error('Failed to load messages');
                console.error('Failed to load messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [isConnected, isAuthLoading, searchParams]);

    if (isAuthLoading || isLoading) {
        return <SentMessageListSkeleton n={4} />
    }

    if (!isLoading && messages.length === 0) {
        return (
            <EmptyState
                title="No Messages found"
                icon={MessageCircle}
                description="We found no messages in your sentbox"
                interactive
                className="my-8"
            />
        )
    }

    return (
        <div className="space-y-6">
            {messages.map((message) => (
                <AnimatedListItem key={message.messageId}>
                    <MessageCard message={message} />
                </AnimatedListItem>
            ))}
            {messages.length > 0 &&
                <Suspense>
                    <InfinityScrollControls
                        totalPages={Math.ceil(totalItems / DEFAULT_PAGE_SIZE)}
                    />
                </Suspense>
            }
        </div>
    );
}