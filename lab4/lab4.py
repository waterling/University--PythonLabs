"""
Прочитать из файла (имя - параметр командной строки)
все слова (разделитель пробел)

Создать "Похожий" словарь который отображает каждое слово из файла
на список всех слов, которые следуют за ним (все варианты).

Список слов может быть в любом порядке и включать повторения.
например "and" ['best", "then", "after", "then", ...]

Считаем , что пустая строка предшествует всем словам в файле.

С помощью "Похожего" словаря сгенерировать новый текст
похожий на оригинал.
Т.е. напечатать слово - посмотреть какое может быть следующим
и выбрать случайное.

В качестве теста можно использовать вывод программы как вход.парам. для следующей копии
(для первой вход.парам. - файл)

Файл:
He is not what he should be
He is not what he need to be
But at least he is not what he used to be
  (c) Team Coach


"""

import random
import sys


def main():
    args = sys.argv[1:]
    if not args:
        print('use: file')
        sys.exit(1)
    else:
        print(mem_dict(args[0]))


def mem_dict(filename):
    with open(filename) as f:
        words = [word for line in f for word in line.split()]

    words.insert(0, " ")
    similar = {}
    for index, word in enumerate(words, start=1):
        if word not in similar:
            similar[word] = words[index:]

    words_len = len(similar) - 1
    start_key = list(similar.keys())[random.randint(0, words_len)]
    result = start_key + ' '
    left_list = similar[start_key]
    while words_len > 0:
        curr_key = left_list[random.randint(0, len(left_list) - 1)]
        left_list = similar[curr_key]
        result += curr_key
        result += ' '
        words_len = len(similar[curr_key]) - 1

    return result


if __name__ == '__main__':
    main()
