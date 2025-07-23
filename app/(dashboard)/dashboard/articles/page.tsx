"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Category, Article } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  const { data: categories, error: categoriesError } = useSWR<Category[]>(
    "/api/categories",
    fetcher
  );
  const { data: articles, error: articlesError } = useSWR<Article[]>(
    selectedCategoryId
      ? `/api/articles?categoryId=${selectedCategoryId}`
      : null,
    fetcher
  );

  if (categoriesError) return <div>Failed to load categories</div>;
  if (!categories) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            TED 学习平台
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            通过精选的TED演讲提升你的英语水平，探索知识的无限可能
          </p>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            选择分类
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedCategoryId === category.id
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Articles */}
        {selectedCategoryId && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
              文章列表
            </h2>
            {articlesError && <div>Failed to load articles</div>}
            {!articles && <div>Loading articles...</div>}
            {articles && articles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">该分类下暂无文章</p>
              </div>
            )}
            {articles && articles.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/dashboard/articles/${article.id}`}
                  >
                    <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">
                            {article.title}
                          </CardTitle>
                          {article.isFeatured && (
                            <Badge variant="secondary" className="ml-2">
                              精选
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                          {Array.isArray(article.content)
                            ? article.content[0]
                            : ""}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>5-10 分钟</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>中级</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
