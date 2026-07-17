import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for TransactionsApi
void main() {
  final instance = PaychainSdk().getTransactionsApi();

  group(TransactionsApi, () {
    // Approve a pending compensation
    //
    //Future<Compensation> approveCompensation(String compensationId, { String xCorrelationId }) async
    test('test approveCompensation', () async {
      // TODO
    });

    // Create a compensating transaction
    //
    //Future<Compensation> createCompensation(String transactionId, String idempotencyKey, CompensationRequest compensationRequest, { String xCorrelationId }) async
    test('test createCompensation', () async {
      // TODO
    });

    // Get a transaction
    //
    //Future<Transaction> getTransaction(String transactionId, { String xCorrelationId }) async
    test('test getTransaction', () async {
      // TODO
    });

    // List transactions
    //
    //Future<BuiltList<Transaction>> listTransactions({ int limit, String xCorrelationId }) async
    test('test listTransactions', () async {
      // TODO
    });

  });
}
