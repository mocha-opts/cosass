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
import { BookOpen, Clock, Users, Star, TrendingUp, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 优化的Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              TED 学习平台
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            通过精选的TED演讲提升你的英语水平，探索知识的无限可能
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>1000+ 精选演讲</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>50万+ 学习者</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>4.9 用户评分</span>
            </div>
          </div>
        </motion.div>

        {/* 优化的分类选择 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              探索分类
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-500 hover:shadow-2xl group relative overflow-hidden ${
                    selectedCategoryId === category.id
                      ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-xl"
                      : "hover:shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80"
                  }`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedCategoryId === category.id
                            ? "bg-blue-500 text-white shadow-lg"
                            : "bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white"
                        }`}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="group-hover:text-blue-600 transition-colors duration-300">
                        {category.name}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 优化的文章列表 */}
        <AnimatePresence mode="wait">
          {selectedCategoryId && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  精选文章
                </h2>
                <div className="h-1 flex-1 bg-gradient-to-r from-indigo-500 to-transparent rounded-full"></div>
              </div>

              {articlesError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-red-500 text-lg">加载文章失败</div>
                </motion.div>
              )}

              {!articles && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex items-center gap-3 text-gray-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>加载文章中...</span>
                  </div>
                </motion.div>
              )}

              {articles && articles.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">该分类下暂无文章</p>
                </motion.div>
              )}

              {articles && articles.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {articles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <Link href={`/articles/${article.id}`}>
                        <Card className="h-full cursor-pointer transition-all duration-500 hover:shadow-2xl group bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 border-0 shadow-lg hover:shadow-blue-500/10">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500 rounded-lg"></div>

                          <CardHeader className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <CardTitle className="text-xl line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                                {article.title}
                              </CardTitle>
                              {article.isFeatured && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <Badge className="ml-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                                    <Star className="w-3 h-3 mr-1" />
                                    精选
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="relative">
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-6 leading-relaxed">
                              {Array.isArray(article.content)
                                ? article.content[0]
                                : ""}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>5-10 分钟</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>中级</span>
                                </div>
                              </div>

                              <motion.div
                                whileHover={{ x: 5 }}
                                className="text-blue-500 group-hover:text-blue-600"
                              >
                                <Play className="w-5 h-5" />
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
