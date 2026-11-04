import { useQuery } from "@tanstack/react-query";
import { stallApi } from "../api/stallApi";

export const stallKeys = { all: ["stalls", "all"] as const };

export const useStalls = () => useQuery({ queryKey: stallKeys.all, queryFn: stallApi.listAll });
