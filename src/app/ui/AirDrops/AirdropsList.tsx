'use client'

import { Airdrop } from "@/types/airDrop";
import { AirdropCard } from "./AirdropCard";
import InfinityScrollControls from "../InfinityScrollControls";
import { DEFAULT_PAGE_SIZE } from "@/config/page";
import { Suspense, useEffect, useState, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { AidropsFilterParams, AirdropService } from "@/services/ao/airdropService";
import { AirdropsSkeleton } from "./skeletons/AirdropsSkeleton";
import { EmptyState } from "../EmptyState";
import { useSearchParams } from "next/navigation";

export function AirdropsList() {
    // const appId = useParams().appId as string;
    const searchParams = useSearchParams();
    const appId = searchParams.get('appId') as string;

    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    const [isLoading, startTransition] = useTransition();
    const { isConnected, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        const filterParams = Object.fromEntries(searchParams.entries()) as AidropsFilterParams;

        startTransition(
            async () => {
                try {
                    if (!isAuthLoading && isConnected) {
                        const { data, total } = await AirdropService.fetchAirdrops(appId, filterParams, true);

                        if (data) {
                            setAirdrops(data);
                            setTotalItems(total)
                        }
                    } else {
                        setAirdrops([]);
                        setTotalItems(0)
                    }
                } catch (error) {
                    setAirdrops([]);
                    setTotalItems(0);
                    console.error(error)
                }
            })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, searchParams])

    if (isLoading) {
        return <AirdropsSkeleton n={6} />
    }

    if (!isLoading && airdrops.length === 0) {
        return (
            <EmptyState
                title="No Airdrops Found"
                description={!isConnected ? "Connect your Wallet to view Airdrops!" :
                    "We couldn't find any Airdrops from the results"}
                interactive
                className="my-8"
            />
        )
    }
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {airdrops.map(airdrop => (
                    <AirdropCard
                        key={airdrop.airdropId}
                        airdrop={airdrop}
                        appId={appId}
                    />
                ))}
            </div>
            {airdrops &&
                <Suspense fallback={<AirdropsSkeleton n={6} />}>
                    <InfinityScrollControls
                        totalPages={Math.ceil(totalItems / DEFAULT_PAGE_SIZE)}
                    />
                </Suspense>
            }
        </>
    )
}