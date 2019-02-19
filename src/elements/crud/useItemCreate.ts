import React, { useState, useEffect } from "react";
import { join } from "lodash";
import { useMutation } from "react-apollo-hooks";
import gql from "graphql-tag";

export type NotificationFn = (msg: string) => void;

export interface ErrorCallbackOptions<TInput> {
  input?: TInput;
  error: any;
}

export interface SuccessCallbackOptions<TInput, TResult> {
  input?: TInput;
  result: TResult;
}

export type ErrorCallbackFn<TInput> = (
  options: ErrorCallbackOptions<TInput>
) => void;
export type SuccessCallbackFn<TInput, TResult> = (
  options: SuccessCallbackOptions<TInput, TResult>
) => void;

export interface Options<TInput, TResult> {
  typeName: string;
  fields: Array<string>;
  refetchQueries?: Array<string>;
  errorNotification?: NotificationFn;
  successNotification?: NotificationFn;
  onError?: ErrorCallbackFn<TInput>;
  onSuccess?: SuccessCallbackFn<TInput, TResult>;
}

function makeCreateMutation({
  createMutationName,
  fields,
  typeName,
  inputTypeName
}: any) {
  return gql`
    mutation Create${typeName}($result: ${inputTypeName}!) {
      ${createMutationName}(result: $result) {
        id ${join(fields, " ")}
      }
    }
  `;
}

function makeOptions({ typeName, fields }: any) {
  const inputTypeName = `${typeName}Input`;
  const createName = `create${typeName}`;

  return {
    typeName,
    inputTypeName,
    createName,
    fields
  };
}

type MakeSaveSuccessHandlerOptions<TInput, TResult> = {
  successNotification?: NotificationFn;
  onSuccess?: SuccessCallbackFn<TInput, TResult>;
  errorNotification?: NotificationFn;
  onError?: ErrorCallbackFn<TInput>;
};

function makeSaveHandler<TInput, TResult>({
  successNotification,
  onSuccess,
  errorNotification,
  onError
}: MakeSaveSuccessHandlerOptions<TInput, TResult>) {
  return async (input?: TInput, result?: TResult, error?: any) => {
    if (error) {
      if (errorNotification) {
        errorNotification("Error.");
      }

      if (onError) {
        onError({ input, error });
      }
    } else {
      if (successNotification) {
        successNotification("Success.");
      }

      if (onSuccess) {
        onSuccess({ input, result: result as TResult });
      }
    }
  };
}

export type UseCreateItemResult<TInput, TResult> = {
  save: (input: TInput) => void | Promise<void>;
  saving: boolean;
  result?: TResult;
  currentInput?: TInput;
  error: any;
};
export type UseCreateItem<TInput, TResult> = (
  initialInput?: TInput
) => UseCreateItemResult<TInput, TResult>;

export default function  makeUseItemCreate<TInput, TResult>({
  typeName,
  fields,
  refetchQueries,
  errorNotification,
  successNotification,
  onError,
  onSuccess
}: Options<TInput, TResult>): UseCreateItem<TInput, TResult> {
  const options = makeOptions({ typeName, fields });
  const createMutation = makeCreateMutation(options);
  const onSave = makeSaveHandler({
    successNotification,
    onSuccess,
    errorNotification,
    onError
  });

  return (initialInput?: TInput): UseCreateItemResult<TInput, TResult> => {
    const [currentInput, setCurrentInput] = useState<TInput | undefined>(
      initialInput
    );
    const [result, setResult] = useState<TResult | undefined>(undefined);
    const [error, setError] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [clean, setClean] = useState(true);

    const mutation = useMutation<TResult>(createMutation, {
      refetchQueries: () => refetchQueries ? refetchQueries : [],
    });

    // const mutation = ({ variables }: any) =>
      // new Promise((resolve, reject) => {
        // setTimeout(() => {
          // if (variables.item.a === "10") {
            // return reject(new Error(variables));
          // }
//
          // resolve(variables.item);
        // }, 0);
      // });

    useEffect(
      () => {
        if (!clean) {
          onSave(currentInput, result, error);
        }
      },
      [result, error]
    );

    const save = async (input: TInput) => {
      setSaving(true);
      setClean(false);
      setCurrentInput(input);
      try {
        const result = await mutation({
          variables: {
            item: input
          }
        });

        setResult(result.data);
        setError(null);
      } catch (catchedError) {
        setResult(undefined);
        setError(catchedError);
      } finally {
        setSaving(false);
      }
    };

    return { save, saving, result, currentInput, error };
  };
}

// interface MyInput {
  // name: string;
  // code: string;
// }
//
// interface MyResult {
  // name: string;
  // code: string;
// }
//
// const useItem = makeUseItemCreate<MyInput, MyResult>({
  // typeName: 'Pais',
  // fields: ['name', 'code']
// });
//
// function Novo() {
  // const { save, saving } = useItem();
// }
